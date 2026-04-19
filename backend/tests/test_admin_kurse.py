"""
Test Admin Dashboard and Kurse Page APIs - Iteration 16
Tests: Admin stats, users, transactions, emails endpoints
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHealthCheck:
    """Basic health check"""
    
    def test_health_endpoint(self):
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print("PASSED: Health check endpoint working")


class TestAdminStats:
    """Admin dashboard stats endpoint tests"""
    
    def test_admin_stats_returns_200(self):
        """GET /api/admin/stats should return 200"""
        response = requests.get(f"{BASE_URL}/api/admin/stats")
        assert response.status_code == 200
        print("PASSED: Admin stats returns 200")
    
    def test_admin_stats_has_overview(self):
        """Stats should contain overview section with KPIs"""
        response = requests.get(f"{BASE_URL}/api/admin/stats")
        data = response.json()
        
        assert "overview" in data
        overview = data["overview"]
        assert "total_users" in overview
        assert "total_reports" in overview
        assert "total_revenue" in overview
        assert "total_keys" in overview
        print(f"PASSED: Overview KPIs - Users: {overview['total_users']}, Reports: {overview['total_reports']}, Revenue: €{overview['total_revenue']}, Keys: {overview['total_keys']}")
    
    def test_admin_stats_has_today(self):
        """Stats should contain today's metrics"""
        response = requests.get(f"{BASE_URL}/api/admin/stats")
        data = response.json()
        
        assert "today" in data
        today = data["today"]
        assert "users" in today
        assert "reports" in today
        assert "emails" in today
        print(f"PASSED: Today stats - Users: {today['users']}, Reports: {today['reports']}, Emails: {today['emails']}")
    
    def test_admin_stats_has_keys(self):
        """Stats should contain license keys metrics"""
        response = requests.get(f"{BASE_URL}/api/admin/stats")
        data = response.json()
        
        assert "keys" in data
        keys = data["keys"]
        assert "total" in keys
        assert "active" in keys
        assert "used" in keys
        print(f"PASSED: Keys stats - Total: {keys['total']}, Active: {keys['active']}, Used: {keys['used']}")
    
    def test_admin_stats_has_conversions(self):
        """Stats should contain conversion funnel data"""
        response = requests.get(f"{BASE_URL}/api/admin/stats")
        data = response.json()
        
        assert "conversions" in data
        conversions = data["conversions"]
        assert "diagnosis_to_report" in conversions
        assert "report_to_payment" in conversions
        print(f"PASSED: Conversions - Diagnosis→Report: {conversions['diagnosis_to_report']}%, Report→Payment: {conversions['report_to_payment']}%")
    
    def test_admin_stats_has_emails(self):
        """Stats should contain email metrics"""
        response = requests.get(f"{BASE_URL}/api/admin/stats")
        data = response.json()
        
        assert "emails" in data
        emails = data["emails"]
        assert "total" in emails
        assert "today" in emails
        print(f"PASSED: Email stats - Total: {emails['total']}, Today: {emails['today']}")
    
    def test_admin_stats_has_transactions(self):
        """Stats should contain transaction metrics"""
        response = requests.get(f"{BASE_URL}/api/admin/stats")
        data = response.json()
        
        assert "transactions" in data
        transactions = data["transactions"]
        assert "total" in transactions
        assert "paid" in transactions
        print(f"PASSED: Transaction stats - Total: {transactions['total']}, Paid: {transactions['paid']}")


class TestAdminUsers:
    """Admin users endpoint tests"""
    
    def test_admin_users_returns_200(self):
        """GET /api/admin/users should return 200"""
        response = requests.get(f"{BASE_URL}/api/admin/users")
        assert response.status_code == 200
        print("PASSED: Admin users returns 200")
    
    def test_admin_users_returns_list(self):
        """Users endpoint should return users array and total"""
        response = requests.get(f"{BASE_URL}/api/admin/users")
        data = response.json()
        
        assert "users" in data
        assert "total" in data
        assert isinstance(data["users"], list)
        assert isinstance(data["total"], int)
        print(f"PASSED: Admin users returns list with {data['total']} users")
    
    def test_admin_users_structure(self):
        """Each user should have expected fields"""
        response = requests.get(f"{BASE_URL}/api/admin/users")
        data = response.json()
        
        if data["users"]:
            user = data["users"][0]
            # Check common fields exist (may be None)
            assert "email" in user or "name" in user
            print(f"PASSED: User structure valid - Sample: {user.get('name', 'N/A')} ({user.get('email', 'N/A')})")
        else:
            print("PASSED: Users endpoint works (no users in DB)")


class TestAdminTransactions:
    """Admin transactions endpoint tests"""
    
    def test_admin_transactions_returns_200(self):
        """GET /api/admin/transactions should return 200"""
        response = requests.get(f"{BASE_URL}/api/admin/transactions")
        assert response.status_code == 200
        print("PASSED: Admin transactions returns 200")
    
    def test_admin_transactions_returns_list(self):
        """Transactions endpoint should return transactions array and total"""
        response = requests.get(f"{BASE_URL}/api/admin/transactions")
        data = response.json()
        
        assert "transactions" in data
        assert "total" in data
        assert isinstance(data["transactions"], list)
        assert isinstance(data["total"], int)
        print(f"PASSED: Admin transactions returns list with {data['total']} transactions")


class TestAdminEmails:
    """Admin emails endpoint tests"""
    
    def test_admin_emails_returns_200(self):
        """GET /api/admin/emails should return 200"""
        response = requests.get(f"{BASE_URL}/api/admin/emails")
        assert response.status_code == 200
        print("PASSED: Admin emails returns 200")
    
    def test_admin_emails_returns_list(self):
        """Emails endpoint should return emails array and total"""
        response = requests.get(f"{BASE_URL}/api/admin/emails")
        data = response.json()
        
        assert "emails" in data
        assert "total" in data
        assert isinstance(data["emails"], list)
        assert isinstance(data["total"], int)
        print(f"PASSED: Admin emails returns list with {data['total']} emails")


class TestLicenseKeyEndpoints:
    """License key management endpoints for admin"""
    
    def test_license_list_returns_200(self):
        """GET /api/license/list should return 200"""
        response = requests.get(f"{BASE_URL}/api/license/list")
        assert response.status_code == 200
        print("PASSED: License list returns 200")
    
    def test_license_list_returns_keys(self):
        """License list should return keys array"""
        response = requests.get(f"{BASE_URL}/api/license/list")
        data = response.json()
        
        assert "keys" in data
        assert "total" in data
        assert isinstance(data["keys"], list)
        print(f"PASSED: License list returns {data['total']} keys")
    
    def test_license_create_standard(self):
        """POST /api/license/create should create standard key"""
        response = requests.post(
            f"{BASE_URL}/api/license/create",
            json={"plan": "standard", "email": "test_admin@example.com", "name": "TEST_Admin_User"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "key" in data
        assert data["key"].startswith("WLAD-")
        assert data["plan"] == "standard"
        assert data["status"] == "active"
        print(f"PASSED: Created standard license key: {data['key']}")
        return data["key"]
    
    def test_license_create_fasttrack(self):
        """POST /api/license/create should create fasttrack key"""
        response = requests.post(
            f"{BASE_URL}/api/license/create",
            json={"plan": "fasttrack"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "key" in data
        assert data["key"].startswith("WLAD-")
        assert data["plan"] == "fasttrack"
        print(f"PASSED: Created fasttrack license key: {data['key']}")
    
    def test_license_revoke(self):
        """POST /api/license/revoke/{key} should revoke key"""
        # First create a key to revoke
        create_resp = requests.post(
            f"{BASE_URL}/api/license/create",
            json={"plan": "standard", "notes": "TEST_to_revoke"}
        )
        key = create_resp.json()["key"]
        
        # Revoke it
        response = requests.post(f"{BASE_URL}/api/license/revoke/{key}")
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] is True
        print(f"PASSED: Revoked license key: {key}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
