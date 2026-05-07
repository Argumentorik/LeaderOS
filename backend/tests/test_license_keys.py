"""
License Key System Tests - WLADHUB Leadership Diagnosis Tool
Tests for: create, activate, validate, list, revoke license key endpoints
"""
import pytest
import requests
import os
import re

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHealthCheck:
    """Verify backend is running before license key tests"""
    
    def test_health_check(self):
        """Health check should pass"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print("✓ Health check passed")


class TestLicenseKeyCreate:
    """Tests for POST /api/license/create endpoint"""
    
    def test_create_standard_license_key(self):
        """Create a standard plan license key"""
        response = requests.post(f"{BASE_URL}/api/license/create", json={
            "plan": "standard",
            "email": "start@aiporate.com",
            "name": "TEST_Standard_User",
            "notes": "Test key for standard plan"
        })
        assert response.status_code == 200
        data = response.json()
        
        # Verify key format: WLAD-XXXX-XXXX-XXXX
        assert "key" in data
        key = data["key"]
        assert re.match(r'^WLAD-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$', key), f"Key format invalid: {key}"
        assert data["plan"] == "standard"
        assert data["status"] == "active"
        print(f"✓ Standard license key created: {key}")
        
        # Store for later tests
        TestLicenseKeyCreate.standard_key = key
    
    def test_create_fasttrack_license_key(self):
        """Create a fasttrack plan license key"""
        response = requests.post(f"{BASE_URL}/api/license/create", json={
            "plan": "fasttrack",
            "email": "start@aiporate.com",
            "name": "TEST_FastTrack_User",
            "notes": "Test key for fasttrack plan"
        })
        assert response.status_code == 200
        data = response.json()
        
        # Verify key format
        assert "key" in data
        key = data["key"]
        assert re.match(r'^WLAD-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$', key)
        assert data["plan"] == "fasttrack"
        assert data["status"] == "active"
        print(f"✓ FastTrack license key created: {key}")
        
        # Store for later tests
        TestLicenseKeyCreate.fasttrack_key = key
    
    def test_create_key_without_email(self):
        """Create a license key without email (unassigned)"""
        response = requests.post(f"{BASE_URL}/api/license/create", json={
            "plan": "standard"
        })
        assert response.status_code == 200
        data = response.json()
        
        assert "key" in data
        assert re.match(r'^WLAD-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$', data["key"])
        print(f"✓ Unassigned license key created: {data['key']}")
        
        # Store for revoke test
        TestLicenseKeyCreate.unassigned_key = data["key"]


class TestLicenseKeyValidate:
    """Tests for GET /api/license/validate/{key} endpoint"""
    
    def test_validate_active_key(self):
        """Validate an active (unused) key"""
        key = getattr(TestLicenseKeyCreate, 'standard_key', None)
        if not key:
            pytest.skip("No standard key created")
        
        response = requests.get(f"{BASE_URL}/api/license/validate/{key}")
        assert response.status_code == 200
        data = response.json()
        
        assert data["valid"]
        assert data["status"] == "active"
        assert data["plan"] == "standard"
        assert "message" in data
        print(f"✓ Active key validation passed: {key}")
    
    def test_validate_nonexistent_key(self):
        """Validate a non-existent key returns valid=false"""
        fake_key = "WLAD-FAKE-FAKE-FAKE"
        response = requests.get(f"{BASE_URL}/api/license/validate/{fake_key}")
        assert response.status_code == 200
        data = response.json()
        
        assert not data["valid"]
        assert "message" in data
        print(f"✓ Non-existent key validation returned valid=false")


class TestLicenseKeyActivate:
    """Tests for POST /api/license/activate endpoint"""
    
    def test_activate_valid_key(self):
        """Activate a valid license key and get redirect URL"""
        key = getattr(TestLicenseKeyCreate, 'fasttrack_key', None)
        if not key:
            pytest.skip("No fasttrack key created")
        
        response = requests.post(f"{BASE_URL}/api/license/activate", json={
            "license_key": key,
            "email": "start@aiporate.com"
        })
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"]
        assert data["plan"] == "fasttrack"
        assert "plan_name" in data
        assert data["redirect_url"] == "https://leader-os.de"
        assert "expires_at" in data
        assert "message" in data
        print(f"✓ Key activated successfully, redirect_url: {data['redirect_url']}")
    
    def test_activate_already_used_key(self):
        """Activating an already-used key should return error"""
        key = getattr(TestLicenseKeyCreate, 'fasttrack_key', None)
        if not key:
            pytest.skip("No fasttrack key created")
        
        response = requests.post(f"{BASE_URL}/api/license/activate", json={
            "license_key": key,
            "email": "another@example.com"
        })
        assert response.status_code == 400
        data = response.json()
        
        assert "detail" in data
        assert "bereits aktiviert" in data["detail"].lower() or "already" in data["detail"].lower()
        print(f"✓ Already-used key correctly rejected")
    
    def test_activate_invalid_key(self):
        """Activating an invalid key should return 404"""
        response = requests.post(f"{BASE_URL}/api/license/activate", json={
            "license_key": "WLAD-XXXX-YYYY-ZZZZ",
            "email": "test@example.com"
        })
        assert response.status_code == 404
        data = response.json()
        
        assert "detail" in data
        print(f"✓ Invalid key correctly returned 404")
    
    def test_activate_key_with_lowercase(self):
        """Activation should work with lowercase key (auto-uppercase)"""
        # Create a new key for this test
        create_response = requests.post(f"{BASE_URL}/api/license/create", json={
            "plan": "standard",
            "notes": "TEST_lowercase_activation"
        })
        assert create_response.status_code == 200
        key = create_response.json()["key"]
        
        # Try activating with lowercase
        lowercase_key = key.lower()
        response = requests.post(f"{BASE_URL}/api/license/activate", json={
            "license_key": lowercase_key
        })
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"]
        assert data["redirect_url"] == "https://leader-os.de"
        print(f"✓ Lowercase key activation worked")


class TestLicenseKeyList:
    """Tests for GET /api/license/list endpoint"""
    
    def test_list_all_keys(self):
        """List all license keys with total count"""
        response = requests.get(f"{BASE_URL}/api/license/list")
        assert response.status_code == 200
        data = response.json()
        
        assert "keys" in data
        assert "total" in data
        assert isinstance(data["keys"], list)
        assert data["total"] >= 0
        assert data["total"] == len(data["keys"])
        
        # Verify key structure if keys exist
        if data["keys"]:
            key_doc = data["keys"][0]
            assert "key" in key_doc
            assert "plan" in key_doc
            assert "status" in key_doc
            assert "created_at" in key_doc
        
        print(f"✓ Listed {data['total']} license keys")


class TestLicenseKeyRevoke:
    """Tests for POST /api/license/revoke/{key} endpoint"""
    
    def test_revoke_key(self):
        """Revoke a license key"""
        key = getattr(TestLicenseKeyCreate, 'unassigned_key', None)
        if not key:
            pytest.skip("No unassigned key created")
        
        response = requests.post(f"{BASE_URL}/api/license/revoke/{key}")
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"]
        assert "message" in data
        print(f"✓ Key revoked successfully: {key}")
    
    def test_activate_revoked_key(self):
        """Activating a revoked key should return error"""
        key = getattr(TestLicenseKeyCreate, 'unassigned_key', None)
        if not key:
            pytest.skip("No unassigned key created")
        
        response = requests.post(f"{BASE_URL}/api/license/activate", json={
            "license_key": key
        })
        assert response.status_code == 400
        data = response.json()
        
        assert "detail" in data
        assert "deaktiviert" in data["detail"].lower() or "revoked" in data["detail"].lower()
        print(f"✓ Revoked key correctly rejected on activation")
    
    def test_revoke_nonexistent_key(self):
        """Revoking a non-existent key should return 404"""
        response = requests.post(f"{BASE_URL}/api/license/revoke/WLAD-NOPE-NOPE-NOPE")
        assert response.status_code == 404
        data = response.json()
        
        assert "detail" in data
        print(f"✓ Non-existent key revoke returned 404")


class TestLicenseKeyValidateAfterActivation:
    """Tests for validating keys after activation"""
    
    def test_validate_used_key(self):
        """Validate a used key returns valid=true with status=used"""
        key = getattr(TestLicenseKeyCreate, 'fasttrack_key', None)
        if not key:
            pytest.skip("No fasttrack key created")
        
        response = requests.get(f"{BASE_URL}/api/license/validate/{key}")
        assert response.status_code == 200
        data = response.json()
        
        assert data["valid"]
        assert data["status"] == "used"
        assert "activated_by" in data
        assert "expires_at" in data
        print(f"✓ Used key validation shows status=used")
    
    def test_validate_revoked_key(self):
        """Validate a revoked key returns valid=false"""
        key = getattr(TestLicenseKeyCreate, 'unassigned_key', None)
        if not key:
            pytest.skip("No unassigned key created")
        
        response = requests.get(f"{BASE_URL}/api/license/validate/{key}")
        assert response.status_code == 200
        data = response.json()
        
        assert not data["valid"]
        assert data["status"] == "revoked"
        print(f"✓ Revoked key validation shows valid=false")


class TestLicenseKeyFullFlow:
    """End-to-end test: create -> validate -> activate -> re-activate-fails"""
    
    def test_full_license_key_flow(self):
        """Complete flow: create, validate, activate, try re-activate"""
        # Step 1: Create
        create_resp = requests.post(f"{BASE_URL}/api/license/create", json={
            "plan": "standard",
            "email": "start@aiporate.com",
            "name": "TEST_FullFlow_User"
        })
        assert create_resp.status_code == 200
        key = create_resp.json()["key"]
        print(f"  Step 1: Created key {key}")
        
        # Step 2: Validate (should be active)
        validate_resp = requests.get(f"{BASE_URL}/api/license/validate/{key}")
        assert validate_resp.status_code == 200
        assert validate_resp.json()["valid"]
        assert validate_resp.json()["status"] == "active"
        print(f"  Step 2: Validated key - status=active")
        
        # Step 3: Activate
        activate_resp = requests.post(f"{BASE_URL}/api/license/activate", json={
            "license_key": key,
            "email": "start@aiporate.com"
        })
        assert activate_resp.status_code == 200
        assert activate_resp.json()["success"]
        assert activate_resp.json()["redirect_url"] == "https://leader-os.de"
        print(f"  Step 3: Activated key - redirect to leader-os.de")
        
        # Step 4: Try re-activate (should fail)
        reactivate_resp = requests.post(f"{BASE_URL}/api/license/activate", json={
            "license_key": key,
            "email": "another@example.com"
        })
        assert reactivate_resp.status_code == 400
        print(f"  Step 4: Re-activation correctly rejected")
        
        # Step 5: Validate again (should be used)
        validate2_resp = requests.get(f"{BASE_URL}/api/license/validate/{key}")
        assert validate2_resp.status_code == 200
        assert validate2_resp.json()["valid"]
        assert validate2_resp.json()["status"] == "used"
        print(f"  Step 5: Validated key - status=used")
        
        print(f"✓ Full license key flow completed successfully")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
