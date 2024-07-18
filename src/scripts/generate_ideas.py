# File: src/scripts/generate_ideas.py
import sys
import json
import subprocess
import traceback
import os

def generate_ideas_with_llama3(user_data):
    prompt = f"""
    Based on the following user data for their social media content, generate 15 unique and engaging content ideas:
    {json.dumps(user_data, indent=2)}

    Please provide 15 numbered ideas, each on a new line, make sure they are unique engaging and maybe new content ideas.
    """

    try:
        result = subprocess.run(['ollama', 'run', 'llama3'], input=prompt, capture_output=True, text=True, timeout=300)
        if result.returncode != 0:
            print(f"Error running Ollama: {result.stderr}", file=sys.stderr)
            return ["Error: Failed to generate ideas using Ollama."]
        ideas = result.stdout.strip().split('\n')
        # Clean up and limit to 15 ideas
        ideas = [idea.strip() for idea in ideas if idea.strip()][:15]
        return ideas
    except subprocess.TimeoutExpired:
        print("Ollama process timed out", file=sys.stderr)
        return ["Error: AI model timed out while generating ideas."]
    except Exception as e:
        print(f"Error in generate_ideas_with_llama3: {str(e)}", file=sys.stderr)
        print(traceback.format_exc(), file=sys.stderr)
        return [f"Error: {str(e)}"]

if __name__ == "__main__":
    print("Python script started", file=sys.stderr)
    if len(sys.argv) != 2:
        print(json.dumps(["Error: Invalid number of arguments"]))
        sys.exit(1)

    temp_file_path = sys.argv[1]
    try:
        print(f"Reading file: {temp_file_path}", file=sys.stderr)
        if not os.path.exists(temp_file_path):
            print(f"Error: File does not exist: {temp_file_path}", file=sys.stderr)
            print(json.dumps(["Error: Temporary file not found"]))
            sys.exit(1)
        
        with open(temp_file_path, 'r', encoding='utf-8') as file:
            user_data = json.load(file)
        print("User data loaded successfully", file=sys.stderr)
        ideas = generate_ideas_with_llama3(user_data)
        print(json.dumps(ideas))
    except Exception as e:
        print(f"Error in main: {str(e)}", file=sys.stderr)
        print(traceback.format_exc(), file=sys.stderr)
        print(json.dumps([f"Error: {str(e)}"]))
    finally:
        print("Python script finished", file=sys.stderr)