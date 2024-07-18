import torch
from TTS.api import TTS
import os
import argparse

# Set the Coqui TOS agreement
os.environ["COQUI_TOS_AGREED"] = "1"

# Check if CUDA is available, otherwise use CPU
device = "cuda" if torch.cuda.is_available() else "cpu"

# Initialize the TTS model
tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2").to(device)

def clone_voice(text, audio_file):
    # Generate the output file path
    output_path = "./output.wav"
    
    # Perform voice cloning
    tts.tts_to_file(text=text, speaker_wav=audio_file, language="en", file_path=output_path)
    
    return output_path

if __name__ == "__main__":
    # Set up argument parser
    parser = argparse.ArgumentParser(description='Voice Cloning Script')
    parser.add_argument('text', type=str, help='Text to speak')
    parser.add_argument('audio_file', type=str, help='Path to the voice reference audio file')

    # Parse arguments
    args = parser.parse_args()
    
    # Clone the voice using the provided text and audio file path
    output_audio_path = clone_voice(args.text, args.audio_file)
    
    # Output the path of the cloned voice file
    print(f"Cloned voice output file saved at: {output_audio_path}")
