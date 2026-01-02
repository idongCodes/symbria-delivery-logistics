import os

# --- CONFIGURATION ---
output_file = 'bundle.txt'

# Folders to completely ignore
ignore_dirs = {
    'node_modules', 
    '.next', 
    '.git', 
    'dist', 
    'build', 
    '.vscode', 
    'coverage',
    '.idea'
}

# File extensions (and specific filenames) to include
include_extensions = {
    '.ts', 
    '.tsx', 
    '.js', 
    '.jsx', 
    '.json', 
    '.css', 
    '.scss', 
    '.md', 
    '.env.local',
    '.prisma',   # Database Schema
    '.mjs',      # Config files (Tailwind, ESLint)
    '.sql',      # SQL Migrations
    '.gitignore' # Git ignore file
}

# Specific files to ignore (even if they match extension)
ignore_files = {
    'package-lock.json',
    'bundle.py',
    'bundle.txt',
    '.DS_Store',
    'yarn.lock'
}

def is_text_file(filename):
    return any(filename.endswith(ext) for ext in include_extensions)

def bundle_files():
    print(f"📦 Bundling files into {output_file}...")
    with open(output_file, 'w', encoding='utf-8') as outfile:
        # Walk through the directory tree
        for root, dirs, files in os.walk('.'):
            # Modify dirs in-place to skip ignored directories
            dirs[:] = [d for d in dirs if d not in ignore_dirs]
            
            for file in files:
                if file in ignore_files:
                    continue
                
                if is_text_file(file):
                    file_path = os.path.join(root, file)
                    
                    try:
                        with open(file_path, 'r', encoding='utf-8') as infile:
                            content = infile.read()
                            
                            # Write file header and content
                            outfile.write(f"\n{'='*50}\n")
                            outfile.write(f"FILE: {file_path}\n")
                            outfile.write(f"{'='*50}\n\n")
                            outfile.write(content)
                            outfile.write("\n")
                            
                        print(f" + Added: {file_path}")
                    except Exception as e:
                        print(f" ! Skipping {file_path}: {e}")

    print(f"\n✅ Success! All files bundled into: {output_file}")

if __name__ == "__main__":
    bundle_files()