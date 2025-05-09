# Inchworm: Visual QA Testing Made Simple

<img width="563" alt="Screenshot 2025-05-09 at 15 18 53" src="https://github.com/user-attachments/assets/3a7bd5d9-3409-4407-93fc-b632f6da76b6" />


## What is Inchworm?

Inchworm is a Chrome extension that revolutionizes visual QA testing by leveraging AI to automatically detect and analyze visual differences between production and test environments. Say goodbye to tedious manual comparisons and complex, brittle test suites!

## Why Choose Inchworm?

Traditional QA testing approaches often involve:
- Writing and maintaining complex Selenium test scripts
- Dealing with flaky tests that break with minor UI changes
- Spending hours manually comparing screenshots
- Struggling to communicate visual issues to developers

Inchworm replaces these mechanized, error-prone processes with an intelligent, flexible solution that works the way humans do - by actually *looking* at your application.

## Key Features

- **One-Click Screenshot Capture**: Easily capture control (production) and test images
- **AI-Powered Analysis**: Leverages OpenAI's vision models to detect visual differences
- **Intelligent Issue Classification**: Automatically categorizes issues as CRITICAL, MAJOR, MINOR, or COSMETIC
- **Clear Pass/Fail Verdicts**: Get unambiguous results about whether visual differences are acceptable
- **Detailed Reports**: Download comprehensive HTML reports for sharing with your team
- **URL Management**: Save production and test URLs for quick access
- **Model Selection**: Choose from available OpenAI vision models
- **Local Storage**: All images are stored locally in your browser for privacy

## How It Works

1. Enter your OpenAI API key
2. Navigate to your production site and capture a control image
3. Navigate to your test site and capture a test image
4. Click "Run Test" to analyze the differences
5. Review the detailed analysis and clear pass/fail verdict
6. Download the report to share with your team

## Why It's Better Than Mechanized Testing

Unlike traditional mechanized testing approaches that rely on brittle selectors and exact pixel matching, Inchworm:

- **Understands Context**: Recognizes what changes matter and what don't
- **Adapts to Changes**: Isn't broken by minor UI adjustments or responsive design
- **Provides Human-Like Feedback**: Explains issues in plain language, not just "pixel at x,y is different"
- **Requires No Coding**: No test scripts to write or maintain
- **Works Across Redesigns**: Can still identify functional issues even when the UI changes significantly

## Getting Started

1. Install the Inchworm extension from the Chrome Web Store
2. Click the Inchworm icon in your browser toolbar
3. Enter your OpenAI API key and save it
4. Start capturing and comparing screenshots!

## Requirements

- Google Chrome browser
- OpenAI API key with access to vision-capable models

---

## License

MIT License - See LICENSE file for details.
