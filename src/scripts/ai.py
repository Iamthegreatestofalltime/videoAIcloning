import http.server
import socketserver
import json
import subprocess

PORT = 8000

def chat_with_llama3(prompt, json_data):
    full_prompt = f"Given this JSON data: {json.dumps(json_data)}\n\nUser query: {prompt}"
    
    try:
        result = subprocess.run(['ollama', 'run', 'llama3', full_prompt], capture_output=True, text=True, timeout=300)
        return result.stdout.strip() if result.stdout else "No response from Ollama"
    except subprocess.TimeoutExpired:
        return "Error: Llama 3 command timed out"
    except Exception as e:
        return f"Error: {str(e)}"

class AiHandler(http.server.SimpleHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header("Access-Control-Allow-Headers", "X-Requested-With, Content-Type")
        self.end_headers()

    def do_POST(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()

        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        data = json.loads(post_data.decode('utf-8'))
        
        response = chat_with_llama3(data['message'], data['userData'])
        
        self.wfile.write(json.dumps({'response': response}).encode('utf-8'))

    def log_message(self, format, *args):
        print(f"AI Server: {format%args}")

if __name__ == "__main__":
    with socketserver.TCPServer(("", PORT), AiHandler) as httpd:
        print(f"AI Server running at http://localhost:{PORT}")
        httpd.serve_forever()