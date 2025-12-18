import os

# Folders to ignore
IGNORE_DIRS = {'.next', 'node_modules', '.git', '.vercel', 'dist', '.vscode'}
# Files to include
INCLUDE_EXTS = {'.ts', '.tsx', '.prisma', '.css', '.json', '.js', '.mjs', '.sql'}

output_file = 'full_project_code.txt'

with open(output_file, 'w', encoding='utf-8') as outfile:
    outfile.write("### FILE STRUCTURE ###\n")
    # 1. Write File Structure
    for root, dirs, files in os.walk('.'):
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
        level = root.replace('.', '').count(os.sep)
        indent = ' ' * 4 * (level)
        outfile.write(f"{indent}{os.path.basename(root)}/\n")
        subindent = ' ' * 4 * (level + 1)
        for f in files:
             if not f.startswith('.'):
                outfile.write(f"{subindent}{f}\n")
    
    outfile.write("\n\n### FILE CONTENTS ###\n")
    
    # 2. Write File Contents
    for root, dirs, files in os.walk('.'):
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
        for file in files:
            if any(file.endswith(ext) for ext in INCLUDE_EXTS) and file != 'package-lock.json':
                filepath = os.path.join(root, file)
                try:
                    with open(filepath, 'r', encoding='utf-8') as infile:
                        outfile.write(f"\n\n--- START OF FILE: {filepath} ---\n")
                        outfile.write(infile.read())
                        outfile.write(f"\n--- END OF FILE: {filepath} ---\n")
                except Exception as e:
                    print(f"Skipping {filepath}: {e}")

print(f"Done! Upload '{output_file}' to the chat.")
