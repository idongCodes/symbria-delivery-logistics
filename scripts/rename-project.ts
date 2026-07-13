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

function replaceContentInFiles() {
  const projectRoot = path.resolve(__dirname, '..');
  console.log(`Scanning project root: ${projectRoot}`);
  
  const files = getAllFiles(projectRoot);
  console.log(`Found ${files.length} text files to process.`);

  let totalReplacements = 0;

  files.forEach((filePath) => {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // We want to be precise:
    // 1. "rxdeliverylogistics.com" (case-insensitive) -> "rxdeliverylogistics.com"
    // 2. "Rx Delivery Logistics" (case-insensitive) -> "Rx Delivery Logistics"
    // 3. "Rx Delivery Logistics" (case-insensitive) -> "Rx Delivery Logistics"
    // 4. "Rx Delivery Logistics" (case-insensitive) -> "Rx Delivery Logistics"
    // 5. "rx-delivery-logistics" (case-insensitive) -> "rx-delivery-logistics"
    
    let newContent = content;

    // Replace rx-delivery-logistics first to avoid partial matches
    newContent = newContent.replace(/rx-delivery-logistics/gi, 'rx-delivery-logistics');
    
    // Replace rxdeliverylogistics.com
    newContent = newContent.replace(/Rx Delivery Logistics\.com/gi, 'rxdeliverylogistics.com');
    
    // Replace Rx Delivery Logistics / Rx Delivery Logistics / Rx Delivery Logistics
    newContent = newContent.replace(/Rx Delivery Logistics\s+RX\s+Logistics/gi, 'Rx Delivery Logistics');
    newContent = newContent.replace(/Rx Delivery Logistics\s+Logistics/gi, 'Rx Delivery Logistics');
    newContent = newContent.replace(/Rx Delivery Logistics/gi, 'Rx Delivery Logistics');

    // Cleanup nested duplicates
    newContent = newContent.replace(/Rx\s+Delivery\s+Logistics\s+Delivery\s+Logistics/gi, 'Rx Delivery Logistics');
    newContent = newContent.replace(/Rx\s+Delivery\s+Logistics\s+Logistics/gi, 'Rx Delivery Logistics');

    if (newContent !== content) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`Updated: ${path.relative(projectRoot, filePath)}`);
      totalReplacements++;
    }
  });

  console.log(`Replacement complete. Modified ${totalReplacements} files.`);
}

replaceContentInFiles();
