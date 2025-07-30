const fs = require('fs');
const csv = require('fast-csv');

// Load jobs.json
const jobData = JSON.parse(fs.readFileSync('jobs.json', 'utf-8'));

// Result array
const extractedData = [];

// Regex patterns
const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/;
const experienceRegex = /([0-9]+(?:\s*to\s*[0-9]+)?\s*years)/i;
const roleRegex = /(React[\s-]?JS Developer|Frontend Developer|React Developer)/i;
const locationRegex = /(Bangalore|Hyderabad|Mumbai|Chennai|Pune|Delhi|Remote|On-site)/i;
const typeRegex = /(Full[-\s]?time|Contract|Part[-\s]?time|Internship)/i;

for (const text of jobData) {
  const emailMatch = text.match(emailRegex);
  const experienceMatch = text.match(experienceRegex);
  const roleMatch = text.match(roleRegex);
  const locationMatch = text.match(locationRegex);
  const typeMatch = text.match(typeRegex);

  const email = emailMatch ? emailMatch[1] : '';
  const experience = experienceMatch ? experienceMatch[1] : '';
  const role = roleMatch ? roleMatch[1] : '';
  const location = locationMatch ? locationMatch[1] : '';
  const jobType = typeMatch ? typeMatch[1] : '';

  const nameContact = email ? email.split('@')[0] : '';

  extractedData.push({
    Email: email,
    Role: role,
    Experience: experience,
    Location: location,
    Type: jobType,
    Contact: nameContact
  });
}

// Save to CSV
const ws = fs.createWriteStream('jobs_extracted.csv');
csv.write(extractedData, { headers: true }).pipe(ws);

console.log('✅ Data extracted and saved to jobs_extracted.csv');
