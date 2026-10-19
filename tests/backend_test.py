import requests
import json
import sys
from datetime import datetime, timezone, timedelta
import random
import string

class WladBotAPITester:
    def __init__(self, base_url="https://command-center-229.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.user_data = None
        self.session_id = None
        self.task_id = None
        self.simulation_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        self.failed_tests = []

    def run_test(self, name, method, endpoint, expected_status, data=None, check_response=True):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                if check_response and response.content:
                    try:
                        resp_json = response.json()
                        print(f"📋 Response keys: {list(resp_json.keys()) if isinstance(resp_json, dict) else 'Array/Simple'}")
                    except:
                        pass
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"💥 Error: {error_detail}")
                except:
                    print(f"💥 Error: {response.text[:200]}")

            result = {
                "test_name": name,
                "endpoint": endpoint,
                "method": method,
                "expected_status": expected_status,
                "actual_status": response.status_code,
                "success": success,
                "response_data": response.json() if success and response.content else {}
            }
            self.test_results.append(result)
            return success, response.json() if success and response.content else {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            result = {
                "test_name": name,
                "endpoint": endpoint,
                "method": method,
                "expected_status": expected_status,
                "actual_status": 0,
                "success": False,
                "error": str(e)
            }
            self.test_results.append(result)
            return False, {}

    def test_auth_flow(self):
        """Test complete authentication flow"""
        print("=== Authentication Tests ===")
        
        # Use existing test user from review request
        test_email = "test@wladbot.com"
        test_password = "test123"

        # Test login with existing user
        success, response = self.run_test(
            "User Login",
            "POST",
            "auth/login", 
            200,
            data={"email": test_email, "password": test_password}
        )
        
        if success and 'token' in response and 'user' in response:
            self.token = response['token']
            self.user_data = response['user']
            print(f"✅ Logged in user: {self.user_data.get('name')} ({self.user_data.get('user_id')})")
        else:
            print("❌ Login failed, trying registration...")
            # Try registration as fallback
            timestamp = str(int(datetime.now().timestamp()))
            fallback_email = f"test.user.{timestamp}@example.com"
            success, response = self.run_test(
                "User Registration (fallback)",
                "POST", 
                "auth/register",
                200,
                data={"email": fallback_email, "password": "TestPass123!", "name": "Test User WladBot"}
            )
            if success and 'token' in response:
                self.token = response['token']
                self.user_data = response['user']

        # Test auth/me endpoint
        if self.token:
            self.run_test("Auth Me", "GET", "auth/me", 200)

        return bool(self.token)

    def test_dashboard(self):
        """Test dashboard endpoint - V2 includes streak and upcoming_events"""
        print("\n=== Dashboard Tests ===")
        success, response = self.run_test("Dashboard Data", "GET", "dashboard", 200)
        
        if success:
            # V2 expected keys include streak and upcoming_events
            expected_keys = ['user', 'recent_tasks', 'recent_simulations', 'task_stats', 'daily_tip', 'streak', 'upcoming_events']
            missing_keys = [key for key in expected_keys if key not in response]
            if missing_keys:
                print(f"⚠️ Missing dashboard keys: {missing_keys}")
            else:
                print("✅ Dashboard has all expected data structure")
            
            # Verify streak structure
            if 'streak' in response and isinstance(response['streak'], dict):
                if 'days' in response['streak']:
                    print(f"✅ User streak: {response['streak']['days']} days")
                else:
                    print("⚠️ Streak missing 'days' field")
            
            # Verify upcoming_events
            if 'upcoming_events' in response:
                events_count = len(response['upcoming_events'])
                print(f"✅ Upcoming events: {events_count} events")

    def test_chat_system(self):
        """Test chat functionality"""
        print("\n=== Chat Tests ===")
        
        # Create chat session
        success, response = self.run_test(
            "Create Chat Session",
            "POST",
            "chat/sessions",
            200,
            data={"title": "Test Conversation", "agent": "Vision Agent"}
        )
        
        if success and 'session_id' in response:
            self.session_id = response['session_id']
            
            # Test chat message (this calls OpenAI so may take a few seconds)
            print("⏰ Testing AI chat (may take 5-10 seconds for OpenAI response)...")
            success, response = self.run_test(
                "Send Chat Message",
                "POST",
                "chat",
                200,
                data={
                    "message": "I need to give feedback to an underperforming employee. Can you help?",
                    "session_id": self.session_id,
                    "agent": "Communication Agent"
                }
            )
            
            if success:
                if 'response' in response and isinstance(response['response'], dict):
                    ai_response = response['response']
                    required_fields = ['insight', 'strategy', 'action_steps', 'agent_used']
                    present_fields = [f for f in required_fields if f in ai_response and ai_response[f]]
                    print(f"✅ AI Response structure: {present_fields}")
                    
                    # Check if tasks were auto-created
                    if ai_response.get('tasks'):
                        print(f"✅ AI generated {len(ai_response['tasks'])} tasks automatically")
                else:
                    print("⚠️ AI response structure missing or invalid")
            
            # Test chat history
            if self.session_id:
                self.run_test("Chat History", "GET", f"chat/history/{self.session_id}", 200)

        # Test list sessions
        self.run_test("List Chat Sessions", "GET", "chat/sessions", 200)

    def test_tasks_crud(self):
        """Test tasks CRUD operations"""
        print("\n=== Tasks CRUD Tests ===")
        
        # Get tasks
        self.run_test("Get Tasks", "GET", "tasks", 200)
        
        # Create task
        success, response = self.run_test(
            "Create Task",
            "POST",
            "tasks",
            200,
            data={
                "title": "Test Task - Leadership Review",
                "description": "Review team performance and provide feedback",
                "category": "leadership",
                "priority": "high"
            }
        )
        
        if success and 'task_id' in response:
            self.task_id = response['task_id']
            
            # Update task
            self.run_test(
                "Update Task Status",
                "PUT",
                f"tasks/{self.task_id}",
                200,
                data={"status": "completed"}
            )
            
            # Delete task  
            self.run_test(
                "Delete Task",
                "DELETE",
                f"tasks/{self.task_id}",
                200
            )

    def test_simulations(self):
        """Test simulation system - V2 includes salary-negotiation scenario"""
        print("\n=== Simulations Tests ===")
        
        # Get scenarios
        success, response = self.run_test("Get Simulation Scenarios", "GET", "simulations/scenarios", 200)
        
        if success and response:
            # Check for salary-negotiation scenario
            scenario_ids = [s.get('scenario_id') for s in response if isinstance(s, dict)]
            if 'salary-negotiation' in scenario_ids:
                print("✅ Salary negotiation scenario found")
            else:
                print("⚠️ Salary negotiation scenario missing from scenarios")
            
            scenario_id = response[0].get('scenario_id') if response else 'feedback-session'
            
            # Start simulation (calls OpenAI)
            print("⏰ Starting simulation (may take 5-10 seconds for AI response)...")
            success, response = self.run_test(
                "Start Simulation",
                "POST",
                "simulations",
                200,
                data={"scenario": scenario_id, "difficulty": "medium"}
            )
            
            if success and 'simulation_id' in response:
                self.simulation_id = response['simulation_id']
                print(f"✅ Started simulation with initial AI message")
                
                # Send simulation message
                print("⏰ Sending simulation message...")
                self.run_test(
                    "Simulation Message",
                    "POST",
                    f"simulations/{self.simulation_id}/message",
                    200,
                    data={"message": "Hi, I wanted to talk to you about your recent work."}
                )
                
                # End simulation
                print("⏰ Ending simulation...")
                success, response = self.run_test(
                    "End Simulation",
                    "POST",
                    f"simulations/{self.simulation_id}/message",
                    200,
                    data={"message": "end simulation"}
                )
                
                if success and response.get('scores'):
                    print("✅ Simulation ended with scores")
                    
        # List simulations
        self.run_test("List Simulations", "GET", "simulations", 200)

    def test_playbooks(self):
        """Test playbooks system"""
        print("\n=== Playbooks Tests ===")
        
        # Get playbooks
        success, response = self.run_test("Get Playbooks", "GET", "playbooks", 200)
        
        if success and response:
            playbook_id = response[0].get('playbook_id') if response else 'difficult-conversation'
            
            # Start playbook
            success, response = self.run_test(
                "Start Playbook",
                "POST",
                f"playbooks/{playbook_id}/start",
                200
            )
            
            if success and 'session_id' in response:
                print("✅ Playbook started successfully")
                
                # Test playbook step (calls OpenAI)
                print("⏰ Testing playbook step...")
                self.run_test(
                    "Playbook Step",
                    "POST",
                    f"playbooks/{playbook_id}/step",
                    200,
                    data={"step_index": 0, "user_input": "I have an employee who is consistently missing deadlines"}
                )

    def test_events(self):
        """Test events system"""
        print("\n=== Events Tests ===")
        
        success, response = self.run_test("Get Events", "GET", "events", 200)
        
        if success and response:
            event_id = response[0].get('event_id') if response else None
            if event_id:
                self.run_test(
                    "Register for Event", 
                    "POST",
                    f"events/{event_id}/register",
                    200
                )

    def test_progress(self):
        """Test progress and leaderboard"""
        print("\n=== Progress Tests ===")
        
        self.run_test("Get Progress", "GET", "progress", 200)
        self.run_test("Get Leaderboard", "GET", "leaderboard", 200)

    def test_challengers(self):
        """Test V2 leadership challengers system"""
        print("\n=== V2 Challengers Tests ===")
        
        # Get challengers - should return 8 leadership challengers
        success, response = self.run_test("Get Challengers", "GET", "challengers", 200)
        
        if success and response:
            if len(response) == 8:
                print("✅ Found 8 leadership challengers as expected")
                # Check challenger structure
                challenger = response[0]
                expected_fields = ['challenger_id', 'name', 'title', 'style', 'difficulty']
                missing_fields = [f for f in expected_fields if f not in challenger]
                if not missing_fields:
                    print("✅ Challenger data structure is complete")
                else:
                    print(f"⚠️ Missing challenger fields: {missing_fields}")
                
                # Test starting a challenge
                challenger_id = challenger.get('challenger_id')
                if challenger_id:
                    print("⏰ Starting challenge (may take 5-10 seconds for AI response)...")
                    success, response = self.run_test(
                        "Start Challenge",
                        "POST",
                        f"challengers/{challenger_id}/start",
                        200
                    )
                    
                    if success and 'challenge_id' in response:
                        challenge_id = response['challenge_id']
                        print("✅ Challenge started successfully")
                        
                        # Test challenge message
                        print("⏰ Testing challenge message...")
                        self.run_test(
                            "Challenge Message",
                            "POST",
                            f"challengers/{challenger_id}/message",
                            200,
                            data={
                                "message": "I believe in long-term thinking and customer obsession as key leadership principles.",
                                "challenge_id": challenge_id
                            }
                        )
                        
                        # Get challenge history
                        self.run_test("Challenge History", "GET", "challengers/history", 200)
            else:
                print(f"⚠️ Expected 8 challengers, found {len(response)}")

    def test_agent_scenarios(self):
        """Test V2 agent scenarios system"""
        print("\n=== V2 Agent Scenarios Tests ===")
        
        # Get all agent scenarios
        success, response = self.run_test("Get Agent Scenarios", "GET", "agents/scenarios", 200)
        
        if success and response:
            agents = list(response.keys()) if isinstance(response, dict) else []
            if 'Vision Agent' in agents:
                print("✅ Vision Agent scenarios found")
                
                # Test specific agent scenarios - Vision Agent should have 4 scenarios
                success, agent_response = self.run_test(
                    "Get Vision Agent Scenarios", 
                    "GET", 
                    "agents/scenarios/Vision%20Agent", 
                    200
                )
                
                if success and agent_response:
                    if len(agent_response) == 4:
                        print("✅ Vision Agent has 4 scenarios as expected")
                    else:
                        print(f"⚠️ Vision Agent has {len(agent_response)} scenarios, expected 4")
                        
                    # Check scenario structure
                    if agent_response:
                        scenario = agent_response[0]
                        expected_fields = ['id', 'title', 'description', 'icon']
                        missing_fields = [f for f in expected_fields if f not in scenario]
                        if not missing_fields:
                            print("✅ Agent scenario structure is complete")
                        else:
                            print(f"⚠️ Missing scenario fields: {missing_fields}")
            else:
                print("⚠️ Vision Agent not found in scenarios")

    def test_advice_reports(self):
        """Test V2 advice reports system (requires completed playbook)"""
        print("\n=== V2 Advice Reports Tests ===")
        
        # First, we need a completed playbook session
        success, playbooks_response = self.run_test("Get Playbooks", "GET", "playbooks", 200)
        
        if success and playbooks_response:
            playbook_id = playbooks_response[0].get('playbook_id') if playbooks_response else 'difficult-conversation'
            
            # Start playbook
            success, response = self.run_test(
                "Start Playbook for Report",
                "POST",
                f"playbooks/{playbook_id}/start",
                200
            )
            
            if success and 'session_id' in response:
                # Complete first step
                print("⏰ Completing playbook step for report generation...")
                success, step_response = self.run_test(
                    "Complete Playbook Step",
                    "POST",
                    f"playbooks/{playbook_id}/step",
                    200,
                    data={"step_index": 0, "user_input": "I need to address an employee who consistently misses deadlines and affects team morale"}
                )
                
                if success:
                    # Try to generate advice report (may fail if playbook not fully completed)
                    print("⏰ Attempting to generate advice report...")
                    success, report_response = self.run_test(
                        "Generate Advice Report",
                        "POST",
                        f"playbooks/{playbook_id}/report",
                        200  # May return 404 if playbook not completed
                    )
                    
                    if success and report_response:
                        expected_fields = ['top_10_insights', 'strengths', 'improvements', 'next_steps', 'leadership_recommendations']
                        present_fields = [f for f in expected_fields if f in report_response]
                        print(f"✅ Advice report generated with fields: {present_fields}")
                    else:
                        print("ℹ️ Advice report requires fully completed playbook (expected behavior)")

    def test_voice_transcription(self):
        """Test V2 voice transcription system"""
        print("\n=== V2 Voice Transcription Tests ===")
        
        # Note: This test would require actual audio file upload
        # For now, we'll just test the endpoint existence and proper error handling
        print("ℹ️ Voice transcription test requires audio file - testing endpoint accessibility")
        
        # Test with empty request (should fail gracefully)
        try:
            url = f"{self.base_url}/api/voice/transcribe"
            headers = {'Authorization': f'Bearer {self.token}'} if self.token else {}
            response = requests.post(url, headers=headers, timeout=10)
            
            if response.status_code == 422:  # Expected - missing file
                print("✅ Voice transcription endpoint exists and handles missing file correctly")
            elif response.status_code == 401:
                print("⚠️ Voice transcription requires authentication")
            else:
                print(f"ℹ️ Voice transcription endpoint status: {response.status_code}")
        except Exception as e:
            print(f"⚠️ Voice transcription endpoint test error: {str(e)}")

    def run_all_tests(self):
        """Run complete test suite"""
        print(f"🚀 Starting WladBot API Tests")
        print(f"🌐 Backend URL: {self.base_url}")
        print(f"🕒 Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Test authentication first
        if not self.test_auth_flow():
            print("❌ Authentication failed - stopping all tests")
            return False
        
        # Run all other tests
        self.test_dashboard()
        self.test_chat_system()
        self.test_tasks_crud()
        self.test_simulations()
        self.test_playbooks()
        self.test_events()
        self.test_progress()
        
        # V2 NEW FEATURES
        self.test_challengers()
        self.test_agent_scenarios()
        self.test_advice_reports()
        self.test_voice_transcription()
        
        # Print summary
        print(f"\n" + "="*50)
        print(f"📊 Test Summary")
        print(f"✅ Passed: {self.tests_passed}/{self.tests_run}")
        print(f"❌ Failed: {self.tests_run - self.tests_passed}/{self.tests_run}")
        print(f"📈 Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        # Show failed tests
        failed_tests = [t for t in self.test_results if not t['success']]
        if failed_tests:
            print(f"\n❌ Failed Tests:")
            for test in failed_tests[:5]:  # Show first 5 failures
                error_msg = test.get('error', f'Status {test.get("actual_status")}')
                print(f"  - {test['test_name']}: {error_msg}")
        
        return self.tests_passed == self.tests_run

    def test_v3_operative_tools(self):
        """Test V3 Operative Tools features"""
        print("\n=== V3 Operative Tools Tests ===")
        
        # Test GET /api/tools returns 7 operative tools
        success, response = self.run_test(
            "GET /api/tools (7 operative tools)",
            "GET",
            "tools",
            200
        )
        if success and isinstance(response, list):
            tool_count = len(response)
            expected_tools = ['conversation-prep', 'email-optimizer', 'decision-maker', 
                            'team-event-planner', 'meeting-builder', 'performance-analysis', 'priority-planner']
            
            if tool_count == 7:
                print(f"✅ Found {tool_count} tools as expected")
                # Check if expected tool IDs are present
                tool_ids = [tool.get('id') for tool in response if isinstance(tool, dict)]
                missing_tools = [tool for tool in expected_tools if tool not in tool_ids]
                if missing_tools:
                    print(f"⚠️  Missing expected tools: {missing_tools}")
                    self.failed_tests.append(f"Tools missing: {missing_tools}")
                else:
                    print(f"✅ All expected tools present")
            else:
                print(f"❌ Expected 7 tools, got {tool_count}")
                self.failed_tests.append(f"Tools count: Expected 7, got {tool_count}")

        # Test conversation-prep tool
        test_input = "I need to have a difficult conversation with an underperforming team member about missed deadlines."
        success, response = self.run_test(
            "POST /api/tools/conversation-prep",
            "POST",
            "tools/conversation-prep",
            200,
            data={"input": test_input}
        )
        if success and isinstance(response, dict):
            result = response.get('result', {})
            if 'conversation_plan' in result or 'feedback_formulations' in result:
                print(f"✅ Conversation prep tool returned structured result")
            else:
                print(f"❌ Missing expected fields in conversation prep result")
                self.failed_tests.append("Conversation prep: Missing structured fields")

        # Test email-optimizer tool
        test_input = "Hi team, we need to discuss the project delays. Please come to my office."
        success, response = self.run_test(
            "POST /api/tools/email-optimizer",
            "POST",
            "tools/email-optimizer",
            200,
            data={"input": test_input}
        )
        if success and isinstance(response, dict):
            result = response.get('result', {})
            if 'optimized_text' in result or 'changes_made' in result:
                print(f"✅ Email optimizer tool returned structured result")
            else:
                print(f"❌ Missing expected fields in email optimizer result")
                self.failed_tests.append("Email optimizer: Missing structured fields")

        # Test decision-maker tool
        test_input = "Should I hire a senior developer or promote someone internally? We need to fill a tech lead position."
        success, response = self.run_test(
            "POST /api/tools/decision-maker",
            "POST",
            "tools/decision-maker",
            200,
            data={"input": test_input}
        )
        if success and isinstance(response, dict):
            result = response.get('result', {})
            if 'pros' in result or 'cons' in result or 'recommendation' in result:
                print(f"✅ Decision maker tool returned structured result")
            else:
                print(f"❌ Missing expected fields in decision maker result")
                self.failed_tests.append("Decision maker: Missing structured fields")

    def test_v3_video_challenges(self):
        """Test V3 Video Challenge features"""
        print("\n=== V3 Video Challenge Tests ===")
        
        # Test GET /api/video-challenges returns 4 video challenges
        success, response = self.run_test(
            "GET /api/video-challenges (4 challenges)",
            "GET",
            "video-challenges",
            200
        )
        if success and isinstance(response, list):
            challenge_count = len(response)
            if challenge_count == 4:
                print(f"✅ Found {challenge_count} video challenges as expected")
                # Check for required fields
                for challenge in response:
                    if not all(key in challenge for key in ['challenge_id', 'title', 'description', 'difficulty']):
                        print(f"⚠️  Challenge missing required fields: {challenge}")
                        self.failed_tests.append(f"Video challenge missing fields: {challenge.get('title', 'Unknown')}")
            else:
                print(f"❌ Expected 4 video challenges, got {challenge_count}")
                self.failed_tests.append(f"Video challenges count: Expected 4, got {challenge_count}")

    def test_v3_enhanced_simulations(self):
        """Test V3 Enhanced Simulations features"""
        print("\n=== V3 Enhanced Simulations Tests ===")
        
        # Test GET /api/simulations/scenarios returns 7 scenarios including hiring-challenge and promotion-pitch
        success, response = self.run_test(
            "GET /api/simulations/scenarios (7 scenarios)",
            "GET",
            "simulations/scenarios",
            200
        )
        if success and isinstance(response, list):
            scenario_count = len(response)
            if scenario_count == 7:
                print(f"✅ Found {scenario_count} scenarios as expected")
                
                # Check for specific scenarios
                scenario_ids = [s.get('scenario_id') for s in response]
                required_scenarios = ['hiring-challenge', 'promotion-pitch']
                found_scenarios = [s for s in required_scenarios if s in scenario_ids]
                
                if len(found_scenarios) == len(required_scenarios):
                    print(f"✅ Found required scenarios: {found_scenarios}")
                else:
                    missing = [s for s in required_scenarios if s not in scenario_ids]
                    print(f"⚠️  Missing required scenarios: {missing}")
                    print(f"Available scenarios: {scenario_ids}")
                    self.failed_tests.append(f"Missing scenarios: {missing}")
            else:
                print(f"❌ Expected 7 scenarios, got {scenario_count}")
                self.failed_tests.append(f"Scenarios count: Expected 7, got {scenario_count}")

    def run_v3_tests(self):
        """Run all V3 specific tests"""
        print("🚀 Starting WladBot V3 Backend Testing...")
        print("=" * 50)
        
        # Test authentication first
        if not self.test_auth_flow():
            print("❌ Authentication failed, stopping V3 tests")
            return False
        
        # Run V3 specific tests
        self.test_v3_operative_tools()
        self.test_v3_video_challenges()
        self.test_v3_enhanced_simulations()
        
        # Print results
        print("\n" + "=" * 50)
        print(f"📊 V3 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.failed_tests:
            print(f"\n❌ Failed Tests:")
            for failure in self.failed_tests:
                print(f"  - {failure}")
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"\n📈 Success Rate: {success_rate:.1f}%")
        
        return self.tests_passed == self.tests_run

def main():
    tester = WladBotAPITester()
    # Run V3 specific tests instead of full test suite for faster feedback
    success = tester.run_v3_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())