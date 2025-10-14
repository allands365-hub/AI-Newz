#!/usr/bin/env python3
"""
AI-Newz Universal Startup Script
Starts both backend and frontend servers with comprehensive error handling
"""

import subprocess
import sys
import os
import time
import threading
import platform
import signal
import psutil
from pathlib import Path

class Colors:
    """ANSI color codes for terminal output"""
    GREEN = '\033[92m'
    BLUE = '\033[94m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    PURPLE = '\033[95m'
    CYAN = '\033[96m'
    WHITE = '\033[97m'
    BOLD = '\033[1m'
    END = '\033[0m'

# Windows compatibility for Unicode characters
def safe_print(text):
    """Print text safely on Windows"""
    try:
        print(text)
    except UnicodeEncodeError:
        # Fallback for Windows console
        print(text.encode('ascii', 'replace').decode('ascii'))

class AINewzStarter:
    def __init__(self):
        self.project_root = self.get_project_directory()
        self.backend_process = None
        self.frontend_process = None
        self.running = True
        
    def get_project_directory(self):
        """Get the project directory, handling different execution contexts"""
        script_dir = Path(__file__).parent.absolute()
        
        # If we're in the correct directory, use it
        if (script_dir / "app").exists():
            return script_dir
        
        # Otherwise, try common project locations
        possible_paths = [
            Path(r"F:\cursor files\4thOct_buildathon"),
            Path.home() / "Documents" / "4thOct_buildathon",
            Path.home() / "Desktop" / "4thOct_buildathon",
        ]
        
        for path in possible_paths:
            if (path / "app").exists():
                return path
        
        # Fallback to current directory
        return Path.cwd()
    
    def print_banner(self):
        """Print the AI-Newz startup banner"""
        banner = f"""
{Colors.PURPLE}{Colors.BOLD}
╔══════════════════════════════════════════════════════════════╗
║                        AI-Newz Platform                     ║
║                   Universal Startup Script                  ║
╚══════════════════════════════════════════════════════════════╝
{Colors.END}
{Colors.CYAN}Project Directory: {self.project_root}{Colors.END}
{Colors.YELLOW}Platform: {platform.system()} {platform.release()}{Colors.END}
{Colors.GREEN}Python Version: {sys.version.split()[0]}{Colors.END}
"""
        safe_print(banner)
    
    def check_dependencies(self):
        """Check if required dependencies are available"""
        safe_print(f"{Colors.BLUE}[INFO] Checking dependencies...{Colors.END}")
        
        # Check Python
        try:
            python_version = subprocess.check_output([sys.executable, "--version"], text=True).strip()
            safe_print(f"{Colors.GREEN}[OK] Python: {python_version}{Colors.END}")
        except:
            safe_print(f"{Colors.RED}[ERROR] Python not found{Colors.END}")
            return False
        
        # Check Node.js
        try:
            node_version = subprocess.check_output(["node", "--version"], text=True).strip()
            safe_print(f"{Colors.GREEN}[OK] Node.js: {node_version}{Colors.END}")
        except:
            safe_print(f"{Colors.RED}[ERROR] Node.js not found{Colors.END}")
            return False
        
        # Check npm
        try:
            # Try npm directly first
            npm_version = subprocess.check_output(["npm", "--version"], text=True).strip()
            safe_print(f"{Colors.GREEN}[OK] npm: {npm_version}{Colors.END}")
        except:
            try:
                # Try npm.cmd on Windows
                npm_version = subprocess.check_output(["npm.cmd", "--version"], text=True).strip()
                safe_print(f"{Colors.GREEN}[OK] npm: {npm_version}{Colors.END}")
            except:
                safe_print(f"{Colors.RED}[ERROR] npm not found{Colors.END}")
                return False
        
        return True
    
    def verify_project_structure(self):
        """Verify that the project structure is correct"""
        safe_print(f"{Colors.BLUE}[INFO] Verifying project structure...{Colors.END}")
        
        required_files = ['app', 'frontend', 'requirements.txt']
        missing_files = []
        
        for file in required_files:
            if not (self.project_root / file).exists():
                missing_files.append(file)
        
        if missing_files:
            safe_print(f"{Colors.RED}[ERROR] Missing required files/directories: {', '.join(missing_files)}{Colors.END}")
            safe_print(f"{Colors.RED}[ERROR] Current directory: {os.getcwd()}{Colors.END}")
            return False
        
        safe_print(f"{Colors.GREEN}[OK] Project structure verified{Colors.END}")
        return True
    
    def kill_existing_processes(self):
        """Kill any existing processes on ports 8000 and 3000"""
        safe_print(f"{Colors.YELLOW}[INFO] Checking for existing processes...{Colors.END}")
        
        ports_to_check = [8000, 3000]
        killed_processes = []
        
        for port in ports_to_check:
            for proc in psutil.process_iter():
                try:
                    connections = proc.net_connections()
                    for conn in connections:
                        if conn.laddr.port == port:
                            safe_print(f"{Colors.YELLOW}[WARN] Killing process {proc.name()} (PID: {proc.pid}) on port {port}{Colors.END}")
                            proc.kill()
                            killed_processes.append(f"{proc.name()} (PID: {proc.pid})")
                except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                    pass
        
        if killed_processes:
            safe_print(f"{Colors.GREEN}[OK] Killed {len(killed_processes)} existing processes{Colors.END}")
        else:
            safe_print(f"{Colors.GREEN}[OK] No conflicting processes found{Colors.END}")
    
    def start_backend(self):
        """Start the backend server"""
        safe_print(f"{Colors.BLUE}[INFO] Starting Backend Server...{Colors.END}")
        
        try:
            # Change to project directory
            os.chdir(self.project_root)
            
            # Set PYTHONPATH
            env = os.environ.copy()
            env['PYTHONPATH'] = str(self.project_root)
            
            # Start uvicorn
            self.backend_process = subprocess.Popen([
                sys.executable, "-m", "uvicorn", 
                "app.main:app", 
                "--reload", 
                "--host", "127.0.0.1", 
                "--port", "8000"
            ], env=env, cwd=self.project_root)
            
            safe_print(f"{Colors.GREEN}[OK] Backend server started (PID: {self.backend_process.pid}){Colors.END}")
            return True
            
        except Exception as e:
            safe_print(f"{Colors.RED}[ERROR] Failed to start backend: {e}{Colors.END}")
            return False
    
    def start_frontend(self):
        """Start the frontend server"""
        safe_print(f"{Colors.BLUE}[INFO] Starting Frontend Server...{Colors.END}")
        
        try:
            frontend_dir = self.project_root / "frontend"
            
            # Determine npm command based on platform
            npm_cmd = "npm.cmd" if platform.system() == "Windows" else "npm"
            
            # Start npm dev server
            self.frontend_process = subprocess.Popen([
                npm_cmd, "run", "dev"
            ], cwd=frontend_dir)
            
            safe_print(f"{Colors.GREEN}[OK] Frontend server started (PID: {self.frontend_process.pid}){Colors.END}")
            return True
            
        except Exception as e:
            safe_print(f"{Colors.RED}[ERROR] Failed to start frontend: {e}{Colors.END}")
            return False
    
    def wait_for_servers(self):
        """Wait for servers to be ready"""
        safe_print(f"{Colors.YELLOW}[INFO] Waiting for servers to start...{Colors.END}")
        
        # Wait for backend
        backend_ready = False
        for i in range(30):  # Wait up to 30 seconds
            try:
                import requests
                response = requests.get("http://localhost:8000/api/v1/newsletters/test", timeout=1)
                if response.status_code == 200:
                    backend_ready = True
                    break
            except:
                pass
            time.sleep(1)
        
        if backend_ready:
            safe_print(f"{Colors.GREEN}[OK] Backend server is ready{Colors.END}")
        else:
            safe_print(f"{Colors.RED}[ERROR] Backend server failed to start{Colors.END}")
        
        # Wait for frontend
        frontend_ready = False
        for i in range(30):  # Wait up to 30 seconds
            try:
                import requests
                response = requests.get("http://localhost:3000", timeout=1)
                if response.status_code == 200:
                    frontend_ready = True
                    break
            except:
                pass
            time.sleep(1)
        
        if frontend_ready:
            safe_print(f"{Colors.GREEN}[OK] Frontend server is ready{Colors.END}")
        else:
            safe_print(f"{Colors.RED}[ERROR] Frontend server failed to start{Colors.END}")
        
        return backend_ready and frontend_ready
    
    def print_status(self):
        """Print server status and URLs"""
        safe_print(f"\n{Colors.PURPLE}{Colors.BOLD}╔══════════════════════════════════════════════════════════════╗{Colors.END}")
        safe_print(f"{Colors.PURPLE}{Colors.BOLD}║                    SERVERS RUNNING!                    ║{Colors.END}")
        safe_print(f"{Colors.PURPLE}{Colors.BOLD}╚══════════════════════════════════════════════════════════════╝{Colors.END}")
        safe_print(f"\n{Colors.CYAN}Frontend: {Colors.WHITE}{Colors.BOLD}http://localhost:3000{Colors.END}")
        safe_print(f"{Colors.CYAN}Backend:  {Colors.WHITE}{Colors.BOLD}http://localhost:8000{Colors.END}")
        safe_print(f"{Colors.CYAN}API Docs: {Colors.WHITE}{Colors.BOLD}http://localhost:8000/docs{Colors.END}")
        safe_print(f"\n{Colors.YELLOW}Press Ctrl+C to stop both servers{Colors.END}")
        safe_print(f"{Colors.YELLOW}Use 'python start.py --help' for more options{Colors.END}")
    
    def signal_handler(self, signum, frame):
        """Handle Ctrl+C gracefully"""
        safe_print(f"\n{Colors.YELLOW}[INFO] Shutting down servers...{Colors.END}")
        self.running = False
        
        if self.backend_process:
            safe_print(f"{Colors.YELLOW}[INFO] Stopping backend server...{Colors.END}")
            self.backend_process.terminate()
        
        if self.frontend_process:
            safe_print(f"{Colors.YELLOW}[INFO] Stopping frontend server...{Colors.END}")
            self.frontend_process.terminate()
        
        # Wait for processes to terminate
        if self.backend_process:
            self.backend_process.wait()
        if self.frontend_process:
            self.frontend_process.wait()
        
        safe_print(f"{Colors.GREEN}[OK] All servers stopped{Colors.END}")
        sys.exit(0)
    
    def run(self):
        """Main execution method"""
        # Set up signal handler
        signal.signal(signal.SIGINT, self.signal_handler)
        signal.signal(signal.SIGTERM, self.signal_handler)
        
        # Print banner
        self.print_banner()
        
        # Check dependencies
        if not self.check_dependencies():
            safe_print(f"{Colors.RED}[ERROR] Missing dependencies. Please install Python, Node.js, and npm.{Colors.END}")
            return False
        
        # Verify project structure
        if not self.verify_project_structure():
            return False
        
        # Kill existing processes
        self.kill_existing_processes()
        
        # Start servers
        backend_success = self.start_backend()
        time.sleep(2)  # Give backend time to start
        frontend_success = self.start_frontend()
        
        if not backend_success or not frontend_success:
            safe_print(f"{Colors.RED}[ERROR] Failed to start servers{Colors.END}")
            return False
        
        # Wait for servers to be ready
        if self.wait_for_servers():
            self.print_status()
        else:
            safe_print(f"{Colors.RED}[ERROR] Servers failed to start properly{Colors.END}")
            return False
        
        # Keep the script running
        try:
            while self.running:
                time.sleep(1)
        except KeyboardInterrupt:
            self.signal_handler(signal.SIGINT, None)
        
        return True

def main():
    """Main entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(description='AI-Newz Universal Startup Script')
    parser.add_argument('--backend-only', action='store_true', help='Start only the backend server')
    parser.add_argument('--frontend-only', action='store_true', help='Start only the frontend server')
    parser.add_argument('--no-check', action='store_true', help='Skip dependency and structure checks')
    parser.add_argument('--kill', action='store_true', help='Kill existing processes and exit')
    
    args = parser.parse_args()
    
    starter = AINewzStarter()
    
    if args.kill:
        starter.kill_existing_processes()
        safe_print(f"{Colors.GREEN}[OK] All processes killed{Colors.END}")
        return
    
    # For now, we'll implement the full startup
    # TODO: Add backend-only and frontend-only modes
    success = starter.run()
    
    if not success:
        sys.exit(1)

if __name__ == "__main__":
    main()