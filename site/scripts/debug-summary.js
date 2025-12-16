const fs = require('fs');

const content = fs.readFileSync('../content/docs/ai-ml/kiro-ide-comparison-tools.md', 'utf8');
const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---/);

if (frontMatterMatch) {
  const frontMatter = frontMatterMatch[1];
  const summaryMatch = frontMatter.match(/summary:\s*"([^"]+)"/);
  
  if (summaryMatch) {
    console.log('Summary found:', summaryMatch[1]);
    console.log('Length:', summaryMatch[1].length);
  } else {
    console.log('No summary match found');
    console.log('Front matter:', frontMatter.substring(0, 200));
  }
} else {
  console.log('No front matter found');
}