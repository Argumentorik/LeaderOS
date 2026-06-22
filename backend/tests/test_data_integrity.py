"""
Test Data Integrity - Iteration 17
Tests user data flow through the entire funnel:
- UserForm -> Quiz -> Report -> Stripe Checkout -> License Key -> Email
- Admin dashboard enriched user data (has_report, license_key)
- Transactions with name/email fields
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHealthCheck:
    """Basic health check"""
    
    def test_health_endpoint(self):
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print("PASSED: Health check")


class TestUserCreation:
    """Test POST /api/user/create stores name, email, role, session_id correctly"""
    
    def test_create_user_stores_all_fields(self):
        """Verify user creation stores name, email, role, session_id"""
        unique_id = uuid.uuid4().hex[:8]
        payload = {
            "name": f"TEST_User_{unique_id}",
            "email": f"test_{unique_id}@example.com",
            "role": "team_leader",
            "consent_privacy": True,
            "consent_marketing": False
        }
        
        response = requests.post(f"{BASE_URL}/api/user/create", json=payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # Verify all fields are returned
        assert "session_id" in data, "session_id missing from response"
        assert data["name"] == payload["name"], f"Name mismatch: {data.get('name')} != {payload['name']}"
        assert data["email"] == payload["email"], f"Email mismatch: {data.get('email')} != {payload['email']}"
        assert data["role"] == payload["role"], f"Role mismatch: {data.get('role')} != {payload['role']}"
        
        print(f"PASSED: User created with session_id={data['session_id']}, name={data['name']}, email={data['email']}, role={data['role']}")
        return data


class TestReportGeneration:
    """Test POST /api/quiz/generate-report links report to user and stores user.name, user.email"""
    
    def test_generate_report_stores_user_data(self):
        """Create user, generate report, verify user data in report"""
        # Step 1: Create user
        unique_id = uuid.uuid4().hex[:8]
        user_payload = {
            "name": f"TEST_ReportUser_{unique_id}",
            "email": f"report_test_{unique_id}@example.com",
            "role": "manager",
            "consent_privacy": True
        }
        
        user_response = requests.post(f"{BASE_URL}/api/user/create", json=user_payload)
        assert user_response.status_code == 200
        user_data = user_response.json()
        session_id = user_data["session_id"]
        print(f"Created user with session_id: {session_id}")
        
        # Step 2: Generate report with quiz answers
        quiz_payload = {
            "session_id": session_id,
            "answers": [
                {"question_id": 1, "category": "rhetorik", "layer": "rhetoric", "score": 4},
                {"question_id": 2, "category": "fuehrung", "layer": "strategic_eq", "score": 3},
                {"question_id": 3, "category": "eq", "layer": "strategic_eq", "score": 4},
                {"question_id": 4, "category": "kritisches_denken", "layer": "ai_literacy", "score": 3},
                {"question_id": 5, "category": "entscheidung", "layer": "ai_literacy", "score": 4},
                {"question_id": 6, "category": "strategie", "layer": "rhetoric", "score": 3},
            ]
        }
        
        report_response = requests.post(f"{BASE_URL}/api/quiz/generate-report", json=quiz_payload)
        assert report_response.status_code == 200, f"Report generation failed: {report_response.text}"
        
        report_data = report_response.json()
        
        # Verify user data is stored in report
        assert "user" in report_data, "user object missing from report"
        assert report_data["user"]["name"] == user_payload["name"], f"User name mismatch in report: {report_data['user'].get('name')}"
        assert report_data["user"]["email"] == user_payload["email"], f"User email mismatch in report: {report_data['user'].get('email')}"
        assert report_data["user"]["role"] == user_payload["role"], f"User role mismatch in report: {report_data['user'].get('role')}"
        assert report_data["session_id"] == session_id, "session_id mismatch in report"
        
        print(f"PASSED: Report generated with user.name={report_data['user']['name']}, user.email={report_data['user']['email']}")
        
        # Step 3: Verify report can be retrieved
        get_report_response = requests.get(f"{BASE_URL}/api/report/{session_id}")
        assert get_report_response.status_code == 200
        retrieved_report = get_report_response.json()
        assert retrieved_report["user"]["name"] == user_payload["name"]
        assert retrieved_report["user"]["email"] == user_payload["email"]
        
        print(f"PASSED: Report retrieved with correct user data")
        return report_data


class TestAdminUsersEnriched:
    """Test GET /api/admin/users returns enriched users with has_report and license_key"""
    
    def test_admin_users_has_report_field(self):
        """Verify admin users endpoint returns has_report boolean"""
        response = requests.get(f"{BASE_URL}/api/admin/users")
        assert response.status_code == 200
        
        data = response.json()
        assert "users" in data, "users array missing"
        assert "total" in data, "total count missing"
        
        # Check that users have has_report field
        if len(data["users"]) > 0:
            user = data["users"][0]
            assert "has_report" in user, "has_report field missing from user"
            assert isinstance(user["has_report"], bool), "has_report should be boolean"
            print(f"PASSED: Admin users has has_report field (sample: {user.get('name')} has_report={user['has_report']})")
        else:
            print("PASSED: Admin users endpoint works (no users to verify)")
    
    def test_admin_users_license_key_field(self):
        """Verify admin users endpoint returns license_key object"""
        response = requests.get(f"{BASE_URL}/api/admin/users")
        assert response.status_code == 200
        
        data = response.json()
        
        # Check that users have license_key field (can be null or object)
        if len(data["users"]) > 0:
            user = data["users"][0]
            assert "license_key" in user, "license_key field missing from user"
            # license_key can be None or an object with key, status, plan
            if user["license_key"] is not None:
                assert "key" in user["license_key"], "license_key.key missing"
                assert "status" in user["license_key"], "license_key.status missing"
                assert "plan" in user["license_key"], "license_key.plan missing"
                print(f"PASSED: User {user.get('name')} has license_key: {user['license_key']['key']}")
            else:
                print(f"PASSED: User {user.get('name')} has license_key=null (expected for users without keys)")
    
    def test_admin_users_returns_expected_fields(self):
        """Verify admin users returns all expected fields"""
        response = requests.get(f"{BASE_URL}/api/admin/users")
        assert response.status_code == 200
        
        data = response.json()
        if len(data["users"]) > 0:
            user = data["users"][0]
            expected_fields = ["name", "email", "role", "has_report", "license_key", "created_at"]
            for field in expected_fields:
                assert field in user, f"Field '{field}' missing from user object"
            print(f"PASSED: Admin users returns all expected fields: {expected_fields}")


class TestCheckoutAcceptsUserData:
    """Test POST /api/payments/create-checkout accepts email, user_name, user_session_id"""
    
    def test_checkout_accepts_user_fields(self):
        """Verify checkout endpoint accepts email, user_name, user_session_id"""
        unique_id = uuid.uuid4().hex[:8]
        payload = {
            "package_id": "standard_yearly",
            "origin_url": "https://role-assessment-lab.preview.emergentagent.com",
            "email": f"checkout_test_{unique_id}@example.com",
            "user_name": f"TEST_CheckoutUser_{unique_id}",
            "user_session_id": f"test_session_{unique_id}"
        }
        
        response = requests.post(f"{BASE_URL}/api/payments/create-checkout", json=payload)
        assert response.status_code == 200, f"Checkout creation failed: {response.text}"
        
        data = response.json()
        assert "url" in data, "Checkout URL missing"
        assert "session_id" in data, "Stripe session_id missing"
        
        print(f"PASSED: Checkout created with user data, session_id={data['session_id']}")
        return data


class TestAdminTransactions:
    """Test GET /api/admin/transactions shows transactions with name and email fields"""
    
    def test_transactions_have_name_email_fields(self):
        """Verify transactions endpoint returns name and email fields"""
        response = requests.get(f"{BASE_URL}/api/admin/transactions")
        assert response.status_code == 200
        
        data = response.json()
        assert "transactions" in data, "transactions array missing"
        assert "total" in data, "total count missing"
        
        if len(data["transactions"]) > 0:
            tx = data["transactions"][0]
            # Verify name and email fields exist (can be empty string)
            assert "name" in tx, "name field missing from transaction"
            assert "email" in tx, "email field missing from transaction"
            assert "plan" in tx, "plan field missing from transaction"
            assert "amount" in tx, "amount field missing from transaction"
            assert "payment_status" in tx or "status" in tx, "status field missing from transaction"
            
            print(f"PASSED: Transaction has name='{tx.get('name')}', email='{tx.get('email')}', plan={tx.get('plan')}")
        else:
            print("PASSED: Transactions endpoint works (no transactions to verify)")


class TestLicenseKeyCreation:
    """Test POST /api/license/create with email sends license key email"""
    
    def test_create_license_key_with_email(self):
        """Create license key with email and verify response"""
        unique_id = uuid.uuid4().hex[:8]
        payload = {
            "plan": "standard",
            "email": f"license_test_{unique_id}@example.com",
            "name": f"TEST_LicenseUser_{unique_id}"
        }
        
        response = requests.post(f"{BASE_URL}/api/license/create", json=payload)
        assert response.status_code == 200, f"License creation failed: {response.text}"
        
        data = response.json()
        assert "key" in data, "License key missing from response"
        assert "plan" in data, "Plan missing from response"
        assert "status" in data, "Status missing from response"
        assert data["plan"] == "standard"
        assert data["status"] == "active"
        assert data["key"].startswith("WLAD-"), f"Key format invalid: {data['key']}"
        
        print(f"PASSED: License key created: {data['key']} for {payload['email']}")
        return data
    
    def test_create_fasttrack_license_key(self):
        """Create fasttrack license key"""
        unique_id = uuid.uuid4().hex[:8]
        payload = {
            "plan": "fasttrack",
            "email": f"fasttrack_test_{unique_id}@example.com",
            "name": f"TEST_FastTrackUser_{unique_id}"
        }
        
        response = requests.post(f"{BASE_URL}/api/license/create", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["plan"] == "fasttrack"
        print(f"PASSED: Fasttrack license key created: {data['key']}")


class TestLicenseKeyActivation:
    """Test POST /api/license/activate returns redirect_url to leaderos.de"""
    
    def test_activate_license_key_returns_redirect(self):
        """Create and activate license key, verify redirect_url"""
        # Step 1: Create a license key
        unique_id = uuid.uuid4().hex[:8]
        create_payload = {
            "plan": "standard",
            "email": f"activate_test_{unique_id}@example.com",
            "name": f"TEST_ActivateUser_{unique_id}"
        }
        
        create_response = requests.post(f"{BASE_URL}/api/license/create", json=create_payload)
        assert create_response.status_code == 200
        key = create_response.json()["key"]
        print(f"Created key for activation: {key}")
        
        # Step 2: Activate the key
        activate_payload = {
            "license_key": key,
            "email": create_payload["email"]
        }
        
        activate_response = requests.post(f"{BASE_URL}/api/license/activate", json=activate_payload)
        assert activate_response.status_code == 200, f"Activation failed: {activate_response.text}"
        
        data = activate_response.json()
        assert data["success"], "Activation should succeed"
        assert "redirect_url" in data, "redirect_url missing from response"
        assert data["redirect_url"] == "https://leaderos.de", f"redirect_url should be leaderos.de, got: {data['redirect_url']}"
        assert "plan" in data
        assert "plan_name" in data
        assert "expires_at" in data
        
        print(f"PASSED: License key activated, redirect_url={data['redirect_url']}")
    
    def test_activate_invalid_key_returns_error(self):
        """Verify invalid key returns 404"""
        activate_payload = {
            "license_key": "WLAD-XXXX-XXXX-XXXX",
            "email": "test@example.com"
        }
        
        response = requests.post(f"{BASE_URL}/api/license/activate", json=activate_payload)
        assert response.status_code == 404, f"Expected 404 for invalid key, got {response.status_code}"
        print("PASSED: Invalid key returns 404")
    
    def test_activate_already_used_key_returns_error(self):
        """Verify already used key returns 400"""
        # Create and activate a key first
        unique_id = uuid.uuid4().hex[:8]
        create_response = requests.post(f"{BASE_URL}/api/license/create", json={
            "plan": "standard",
            "email": f"used_test_{unique_id}@example.com"
        })
        key = create_response.json()["key"]
        
        # Activate it
        requests.post(f"{BASE_URL}/api/license/activate", json={"license_key": key})
        
        # Try to activate again
        response = requests.post(f"{BASE_URL}/api/license/activate", json={"license_key": key})
        assert response.status_code == 400, f"Expected 400 for used key, got {response.status_code}"
        print("PASSED: Already used key returns 400")


class TestAdminStats:
    """Test admin stats endpoint"""
    
    def test_admin_stats_returns_all_sections(self):
        """Verify admin stats returns all expected sections"""
        response = requests.get(f"{BASE_URL}/api/admin/stats")
        assert response.status_code == 200
        
        data = response.json()
        expected_sections = ["overview", "today", "keys", "conversions", "emails", "transactions", "last_7_days"]
        for section in expected_sections:
            assert section in data, f"Section '{section}' missing from admin stats"
        
        # Verify overview fields
        assert "total_users" in data["overview"]
        assert "total_reports" in data["overview"]
        assert "total_revenue" in data["overview"]
        assert "total_keys" in data["overview"]
        
        print(f"PASSED: Admin stats returns all sections. Users={data['overview']['total_users']}, Reports={data['overview']['total_reports']}")


class TestAdminEmails:
    """Test admin emails endpoint"""
    
    def test_admin_emails_endpoint(self):
        """Verify admin emails endpoint works"""
        response = requests.get(f"{BASE_URL}/api/admin/emails")
        assert response.status_code == 200
        
        data = response.json()
        assert "emails" in data
        assert "total" in data
        
        if len(data["emails"]) > 0:
            email = data["emails"][0]
            assert "type" in email
            assert "email" in email
            assert "sent_at" in email
            print(f"PASSED: Admin emails returns {data['total']} emails")
        else:
            print("PASSED: Admin emails endpoint works (no emails)")


class TestLicenseKeyList:
    """Test license key list endpoint"""
    
    def test_license_list_endpoint(self):
        """Verify license list endpoint works"""
        response = requests.get(f"{BASE_URL}/api/license/list")
        assert response.status_code == 200
        
        data = response.json()
        assert "keys" in data
        assert "total" in data
        
        if len(data["keys"]) > 0:
            key = data["keys"][0]
            assert "key" in key
            assert "plan" in key
            assert "status" in key
            print(f"PASSED: License list returns {data['total']} keys")
        else:
            print("PASSED: License list endpoint works (no keys)")


class TestFullUserJourney:
    """Test full user journey: UserForm -> Quiz -> Report -> verify in admin"""
    
    def test_full_journey_data_integrity(self):
        """Complete user journey and verify data appears correctly in admin"""
        unique_id = uuid.uuid4().hex[:8]
        
        # Step 1: Create user
        user_payload = {
            "name": f"TEST_JourneyUser_{unique_id}",
            "email": f"journey_{unique_id}@example.com",
            "role": "innovator",
            "consent_privacy": True,
            "consent_marketing": True
        }
        
        user_response = requests.post(f"{BASE_URL}/api/user/create", json=user_payload)
        assert user_response.status_code == 200
        user_data = user_response.json()
        session_id = user_data["session_id"]
        print(f"Step 1: User created - session_id={session_id}")
        
        # Step 2: Generate report
        quiz_payload = {
            "session_id": session_id,
            "answers": [
                {"question_id": 1, "category": "rhetorik", "layer": "rhetoric", "score": 4},
                {"question_id": 2, "category": "fuehrung", "layer": "strategic_eq", "score": 4},
                {"question_id": 3, "category": "eq", "layer": "strategic_eq", "score": 3},
                {"question_id": 4, "category": "kritisches_denken", "layer": "ai_literacy", "score": 4},
                {"question_id": 5, "category": "entscheidung", "layer": "ai_literacy", "score": 3},
                {"question_id": 6, "category": "strategie", "layer": "rhetoric", "score": 4},
            ]
        }
        
        report_response = requests.post(f"{BASE_URL}/api/quiz/generate-report", json=quiz_payload)
        assert report_response.status_code == 200
        report_data = report_response.json()
        
        # Verify user data in report
        assert report_data["user"]["name"] == user_payload["name"]
        assert report_data["user"]["email"] == user_payload["email"]
        print(f"Step 2: Report generated with user data intact")
        
        # Step 3: Verify user appears in admin with has_report=True
        admin_response = requests.get(f"{BASE_URL}/api/admin/users")
        assert admin_response.status_code == 200
        admin_data = admin_response.json()
        
        # Find our test user
        test_user = None
        for u in admin_data["users"]:
            if u.get("email") == user_payload["email"]:
                test_user = u
                break
        
        assert test_user is not None, f"Test user not found in admin users list"
        assert test_user["has_report"], f"has_report should be True for user with report"
        assert test_user["name"] == user_payload["name"]
        
        print(f"Step 3: User found in admin with has_report=True")
        print(f"PASSED: Full journey data integrity verified")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
