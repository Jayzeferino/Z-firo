const fs = require('fs');
const path = require('path');

const SKILLS_DIR = path.resolve(__dirname, '..', 'skills');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(fullPath));
    } else if (file === 'SKILL.md') {
      results.push(fullPath);
    }
  });
  return results;
}

function fixSkillFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Expressão regular para achar o bloco do frontmatter
    const frontmatterRegex = /^---([\s\S]+?)---/;
    const match = content.match(frontmatterRegex);
    if (!match) return;

    let frontmatterText = match[1];
    
    // Expressão para achar a linha da descrição
    // description: (tudo exceto nova linha)
    const descRegex = /^description:\s*(?!>-|\|)(.+)$/m;
    const descMatch = frontmatterText.match(descRegex);
    
    if (descMatch) {
      let descText = descMatch[1].trim();
      
      // Remover aspas externas se existirem
      if ((descText.startsWith('"') && descText.endsWith('"')) || (descText.startsWith("'") && descText.endsWith("'"))) {
        descText = descText.substring(1, descText.length - 1);
      }
      
      // Limpar barras invertidas que escapavam aspas
      descText = descText.replace(/\\"/g, '"').replace(/\\'/g, "'").replace(/\\/g, '');

      // Novo bloco com recuo de 2 espaços
      const newDesc = `description: >-\n  ${descText}`;
      
      const newFrontmatterText = frontmatterText.replace(descRegex, newDesc);
      const newContent = content.replace(match[1], newFrontmatterText);
      
      fs.writeFileSync(filePath, newContent, 'utf-8');
      console.log(`✓ Fixed: ${path.relative(SKILLS_DIR, filePath)}`);
    }
  } catch (error) {
    console.error(`✗ Failed to fix ${filePath}:`, error.message);
  }
}

const skillFiles = walk(SKILLS_DIR);
console.log(`Found ${skillFiles.length} SKILL.md files. Fixing frontmatters...`);
skillFiles.forEach(fixSkillFile);
console.log('All skills processed.');
