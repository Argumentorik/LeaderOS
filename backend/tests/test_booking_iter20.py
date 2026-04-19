"""
Iteration 20: Booking System Tests
Tests for POST /api/booking/create and GET /api/booking/list endpoints
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHealthCheck:
    """Health check endpoint test"""
    
    def test_health_check(self):
        """Verify API is healthy"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print("✓ Health check passed")


class TestBookingCreate:
    """Tests for POST /api/booking/create endpoint"""
    
    def test_create_booking_success(self):
        """Create a booking with all required fields"""
        unique_id = uuid.uuid4().hex[:8]
        payload = {
            "date": "2026-06-15",
            "time": "11:00",
            "name": f"TEST_Booking_{unique_id}",
            "email": "start@aiporate.com",
            "plan": "fasttrack"
        }
        response = requests.post(
            f"{BASE_URL}/api/booking/create",
            json=payload
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert data["success"] == True
        assert "message" in data
        assert data["booking_date"] == "2026-06-15"
        assert data["booking_time"] == "11:00"
        print(f"✓ Booking created successfully: {data}")
    
    def test_create_booking_minimal_fields(self):
        """Create a booking with only date and time (minimal required)"""
        payload = {
            "date": "2026-07-01",
            "time": "14:00"
        }
        response = requests.post(
            f"{BASE_URL}/api/booking/create",
            json=payload
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["booking_date"] == "2026-07-01"
        assert data["booking_time"] == "14:00"
        print(f"✓ Minimal booking created: {data}")
    
    def test_create_booking_with_notes(self):
        """Create a booking with optional notes field"""
        unique_id = uuid.uuid4().hex[:8]
        payload = {
            "date": "2026-08-10",
            "time": "15:00",
            "name": f"TEST_Notes_{unique_id}",
            "email": "start@aiporate.com",
            "plan": "fasttrack",
            "notes": "Test booking with notes"
        }
        response = requests.post(
            f"{BASE_URL}/api/booking/create",
            json=payload
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        print(f"✓ Booking with notes created: {data}")
    
    def test_create_booking_returns_correct_response_fields(self):
        """Verify response contains booking_date and booking_time"""
        payload = {
            "date": "2026-09-20",
            "time": "16:00",
            "name": "TEST_ResponseFields",
            "email": "start@aiporate.com",
            "plan": "fasttrack"
        }
        response = requests.post(
            f"{BASE_URL}/api/booking/create",
            json=payload
        )
        assert response.status_code == 200
        data = response.json()
        
        # Required response fields per spec
        assert "success" in data
        assert "message" in data
        assert "booking_date" in data
        assert "booking_time" in data
        print(f"✓ Response fields verified: {list(data.keys())}")


class TestBookingList:
    """Tests for GET /api/booking/list endpoint"""
    
    def test_list_bookings_returns_array(self):
        """Verify list endpoint returns bookings array"""
        response = requests.get(f"{BASE_URL}/api/booking/list")
        assert response.status_code == 200
        data = response.json()
        
        assert "bookings" in data
        assert "total" in data
        assert isinstance(data["bookings"], list)
        assert isinstance(data["total"], int)
        print(f"✓ Bookings list returned: {data['total']} bookings")
    
    def test_list_bookings_contains_required_fields(self):
        """Verify each booking has required fields"""
        response = requests.get(f"{BASE_URL}/api/booking/list")
        assert response.status_code == 200
        data = response.json()
        
        if data["total"] > 0:
            booking = data["bookings"][0]
            required_fields = ["date", "time", "name", "email", "plan", "status", "created_at"]
            for field in required_fields:
                assert field in booking, f"Missing field: {field}"
            print(f"✓ Booking fields verified: {list(booking.keys())}")
        else:
            print("⚠ No bookings to verify fields")
    
    def test_create_and_verify_persistence(self):
        """Create booking and verify it appears in list (persistence test)"""
        unique_id = uuid.uuid4().hex[:8]
        test_name = f"TEST_Persist_{unique_id}"
        
        # Create booking
        create_payload = {
            "date": "2026-10-05",
            "time": "10:00",
            "name": test_name,
            "email": "start@aiporate.com",
            "plan": "fasttrack"
        }
        create_response = requests.post(
            f"{BASE_URL}/api/booking/create",
            json=create_payload
        )
        assert create_response.status_code == 200
        
        # Verify in list
        list_response = requests.get(f"{BASE_URL}/api/booking/list")
        assert list_response.status_code == 200
        data = list_response.json()
        
        # Find our booking
        found = False
        for booking in data["bookings"]:
            if booking["name"] == test_name:
                found = True
                assert booking["date"] == "2026-10-05"
                assert booking["time"] == "10:00"
                assert booking["email"] == "start@aiporate.com"
                assert booking["plan"] == "fasttrack"
                assert booking["status"] == "pending"
                break
        
        assert found, f"Created booking '{test_name}' not found in list"
        print(f"✓ Booking persistence verified: {test_name}")


class TestBookingIntegration:
    """Integration tests for booking system"""
    
    def test_booking_stored_in_mongodb(self):
        """Verify booking is stored in MongoDB bookings collection"""
        unique_id = uuid.uuid4().hex[:8]
        test_name = f"TEST_MongoDB_{unique_id}"
        
        # Create booking
        payload = {
            "date": "2026-11-15",
            "time": "11:00",
            "name": test_name,
            "email": "start@aiporate.com",
            "plan": "fasttrack"
        }
        response = requests.post(
            f"{BASE_URL}/api/booking/create",
            json=payload
        )
        assert response.status_code == 200
        
        # Verify via list endpoint (which reads from MongoDB)
        list_response = requests.get(f"{BASE_URL}/api/booking/list")
        data = list_response.json()
        
        booking_names = [b["name"] for b in data["bookings"]]
        assert test_name in booking_names, "Booking not found in MongoDB"
        print(f"✓ MongoDB persistence verified for: {test_name}")
    
    def test_total_count_increases_after_create(self):
        """Verify total count increases after creating a booking"""
        # Get initial count
        initial_response = requests.get(f"{BASE_URL}/api/booking/list")
        initial_count = initial_response.json()["total"]
        
        # Create new booking
        unique_id = uuid.uuid4().hex[:8]
        payload = {
            "date": "2026-12-01",
            "time": "09:00",
            "name": f"TEST_Count_{unique_id}",
            "email": "start@aiporate.com",
            "plan": "fasttrack"
        }
        requests.post(f"{BASE_URL}/api/booking/create", json=payload)
        
        # Get new count
        new_response = requests.get(f"{BASE_URL}/api/booking/list")
        new_count = new_response.json()["total"]
        
        assert new_count > initial_count, f"Count did not increase: {initial_count} -> {new_count}"
        print(f"✓ Total count increased: {initial_count} -> {new_count}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
