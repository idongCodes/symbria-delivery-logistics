import * as fs from 'fs';
import * as path from 'path';

const IGNORED_DIRS = ['.git', 'node_modules', '.next', '.vercel', 'out', 'build', 'playwright-report', 'test-results'];
const IGNORED_FILES = ['package-lock.json', 'tsconfig.tsbuildinfo'];

function getAllFiles(dirPath: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (!IGNORED_DIRS.includes(file)) {
        getAllFiles(filePath, fileList);
      }
    } else {
      const ext = path.extname(file);
      const isTextFile = ['.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.css', '.sh', '.prisma'].includes(ext) || file === '.env' || file === '.env.local' || file === '.env.temp' || file === '.gitignore';
      if (isTextFile && !IGNORED_FILES.includes(file)) {
        fileList.push(filePath);
      }
    }
  });

  return fileList;
}

function revertEmails() {
  const projectRoot = path.resolve(__dirname, '..');
  console.log(`Scanning project root: ${projectRoot}`);
  
  const files = getAllFiles(projectRoot);
  console.log(`Found ${files.length} text files to process.`);

  let totalReplacements = 0;

  files.forEach((filePath) => {
    // Skip this script itself
    if (filePath.endsWith('revert-emails.ts')) return;

    const content = fs.readFileSync(filePath, 'utf8');
    
    // Replace rxdeliverylogistics.com (case insensitive) with symbria.com
    const newContent = content.replace(/rxdeliverylogistics\.com/gi, 'symbria.com');

    if (newContent !== content) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`Updated: ${path.relative(projectRoot, filePath)}`);
      totalReplacements++;
    }
  });

  console.log(`Reversion complete. Modified ${totalReplacements} files.`);
}

revertEmails();
