const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const WORKSPACE_DIR = path.resolve(__dirname, '..', '..');

// Helper para parsear arquivos com frontmatter YAML
function parseMarkdownWithFrontmatter(filePath) {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const frontmatterRegex = /^---\r?\n([\s\S]+?)\r?\n---\r?\n([\s\S]*)$/;
    const match = fileContent.match(frontmatterRegex);

    if (match) {
      const yamlContent = match[1];
      const markdownContent = match[2];
      const data = yaml.load(yamlContent);
      return {
        ...data,
        body: markdownContent,
        filePath
      };
    }
    return {
      body: fileContent,
      filePath
    };
  } catch (error) {
    console.error(`Error parsing file with frontmatter at ${filePath}:`, error);
    return null;
  }
}

// Escanear Habilidades recursivamente em /skills
function scanSkills() {
  const skillsDir = path.join(WORKSPACE_DIR, 'skills');
  const skills = [];

  if (!fs.existsSync(skillsDir)) {
    fs.mkdirSync(skillsDir, { recursive: true });
    return [];
  }

  function walk(currentDir) {
    const files = fs.readdirSync(currentDir);
    for (const file of files) {
      const fullPath = path.join(currentDir, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        walk(fullPath);
      } else if (file === 'SKILL.md' || file.endsWith('.md')) {
        const parsed = parseMarkdownWithFrontmatter(fullPath);
        if (parsed && parsed.name) {
          skills.push({
            id: path.relative(skillsDir, fullPath).replace(/\\/g, '/'),
            name: parsed.name,
            description: parsed.description || '',
            category: parsed.category || 'Geral',
            inputs: parsed.inputs || [], // Definição de campos de formulário
            filePath: fullPath
          });
        }
      }
    }
  }

  walk(skillsDir);
  return skills;
}

// Escanear Agentes em /agents
function scanAgents() {
  const agentsDir = path.join(WORKSPACE_DIR, 'agents');
  const agents = [];

  if (!fs.existsSync(agentsDir)) {
    fs.mkdirSync(agentsDir, { recursive: true });
    return [];
  }

  const files = fs.readdirSync(agentsDir);
  for (const file of files) {
    const fullPath = path.join(agentsDir, file);
    const stat = fs.statSync(fullPath);

    if (!stat.isDirectory() && (file.endsWith('.yaml') || file.endsWith('.yml') || file.endsWith('.md'))) {
      if (file.endsWith('.md')) {
        const parsed = parseMarkdownWithFrontmatter(fullPath);
        if (parsed && parsed.name) {
          agents.push({
            id: file,
            name: parsed.name,
            role: parsed.role || 'Especialista de Marketing',
            avatar: parsed.avatar || '🤖',
            description: parsed.description || '',
            body: parsed.body || '',
            system_prompt: parsed.system_prompt || parsed.body || '',
            filePath: fullPath
          });
        }
      } else {
        // Arquivo YAML puro
        try {
          const content = fs.readFileSync(fullPath, 'utf-8');
          const data = yaml.load(content);
          if (data && data.name) {
            agents.push({
              id: file,
              name: data.name,
              role: data.role || 'Especialista de Marketing',
              avatar: data.avatar || '🤖',
              description: data.description || '',
              body: data.body || '',
              system_prompt: data.system_prompt || '',
              filePath: fullPath
            });
          }
        } catch (e) {
          console.error(`Error parsing Agent YAML file at ${fullPath}:`, e);
        }
      }
    }
  }

  return agents;
}

module.exports = {
  scanSkills,
  scanAgents
};
