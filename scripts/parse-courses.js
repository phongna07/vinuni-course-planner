#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const INPUT_FILE = path.join(__dirname, 'index.html');
const OUTPUT_FILE = path.join(__dirname, '..', 'src', 'data', 'courses.json');

// Day mapping configuration
const DAY_MAP = {
    M: 'Monday',
    T: 'Tuesday',
    W: 'Wednesday',
    H: 'Thursday',
    F: 'Friday',
    S: 'Saturday',
    U: 'Sunday',
};

/**
 * Extract course data from HTML
 * Mirrors the logic from main.py
 */
function extractCourseData(htmlSource) {
    const $ = cheerio.load(htmlSource);
    const table = $('#CourseList');

    if (table.length === 0) {
        console.warn('Warning: CourseList table not found');
        return [];
    }

    const results = [];

    // Extract rows from tbody
    table.find('tbody tr').each((_, row) => {
        const $row = $(row);
        const cells = $row.find('td');

        if (cells.length === 0) {
            return;
        }

        const rowData = {};

        // Extract course information from specific cell indices
        // 1: Course, 2: Course Title, 3: Section, 4: Dates, 5: Credits, 7: Instructor, 8: Delivery Method
        // Helper function to normalize whitespace like Python's strip=True
        const normalizeText = (text) => text.replace(/\s+/g, ' ').trim();

        rowData.Course = normalizeText($(cells[1]).text());
        rowData['Course Title'] = normalizeText($(cells[2]).text());
        rowData.Section = normalizeText($(cells[3]).text());
        rowData.Dates = normalizeText($(cells[4]).text());
        rowData.Credits = normalizeText($(cells[5]).text());
        rowData.Instructor = normalizeText($(cells[7]).text());
        rowData['Delivery Method'] = normalizeText($(cells[8]).text());

        // Special handling for Schedule column (Index 6)
        const scheduleCell = $(cells[6]);
        const scheduleSpan = scheduleCell.find('span[id="lnkDetails"]');

        let rawScheduleText = '';

        // Prioritize the 'title' attribute if it exists, otherwise use text
        if (scheduleSpan.length > 0) {
            rawScheduleText = scheduleSpan.attr('title') || scheduleSpan.text().trim();
        } else {
            rawScheduleText = scheduleCell.text().trim();
        }

        const parsedSchedule = [];

        if (rawScheduleText && rawScheduleText !== 'No scheduled meetings') {
            // Split by semicolon or newlines to handle multiple schedules
            const scheduleParts = rawScheduleText.split(/[;\n]+/);

            for (const part of scheduleParts) {
                const trimmedPart = part.trim();
                if (!trimmedPart) continue;

                // Regex to separate Day Codes from Time
                // Looks for one or more letters [MTWHFSU] at start, followed by space
                const match = trimmedPart.match(/^([MTWHFSU]+)\s+(.*)/);

                if (match) {
                    const daysCode = match[1];
                    let timeStr = match[2].trim();

                    // Iterate through day codes (e.g., "WF" -> W, F)
                    for (const char of daysCode) {
                        if (char in DAY_MAP) {
                            parsedSchedule.push({
                                day: DAY_MAP[char],
                                time: timeStr,
                            });
                        }
                    }
                }
            }
        }

        rowData.Schedule = parsedSchedule;
        results.push(rowData);
    });

    return results;
}

/**
 * Modify schedule times
 * Mirrors the logic from modify.py
 */
function modifyScheduleTimes(courses) {
    for (const course of courses) {
        // Skip if Schedule is missing or empty
        if (!course.Schedule || course.Schedule.length === 0) {
            continue;
        }

        const newSchedule = [];

        for (const item of course.Schedule) {
            // Skip items without a time field
            if (!item.time) {
                continue;
            }

            // Replace "- " with " to "
            let timeStr = item.time.replace(/- /g, ' to ');

            // Split on ", " if present (e.g., "9:00AM to 12:00PM, 3:30PM to 5:20PM")
            if (timeStr.includes(', ')) {
                const times = timeStr.split(', ');
                for (const t of times) {
                    newSchedule.push({
                        day: item.day || '',
                        time: t,
                    });
                }
            } else {
                newSchedule.push({
                    day: item.day || '',
                    time: timeStr,
                });
            }
        }

        course.Schedule = newSchedule;
    }

    return courses;
}

/**
 * Main execution
 */
async function main() {
    try {
        // Check if input file exists
        if (!fs.existsSync(INPUT_FILE)) {
            console.warn(`\n⚠️  Input file not found: ${INPUT_FILE}`);
            console.warn('Please place your HTML file at scripts/index.html\n');
            return;
        }

        // Read HTML file
        const htmlContent = fs.readFileSync(INPUT_FILE, 'utf-8');

        // Extract course data
        let courses = extractCourseData(htmlContent);

        if (courses.length === 0) {
            console.warn('⚠️  No courses found in the HTML. Ensure the table has id="CourseList"');
            return;
        }

        // Modify schedule times
        courses = modifyScheduleTimes(courses);

        // Ensure output directory exists
        const outputDir = path.dirname(OUTPUT_FILE);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        // Write to JSON file
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(courses, null, 4), 'utf-8');

        console.log(`✓ Successfully parsed ${courses.length} courses`);
        console.log(`✓ Output written to: ${OUTPUT_FILE}`);
    } catch (error) {
        console.error('❌ Error during parsing:', error.message);
        process.exit(1);
    }
}

main();
