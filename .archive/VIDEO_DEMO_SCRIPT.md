# AgentOS Video Demo Script

## Video Overview
**Duration:** 3-5 minutes
**Format:** Screen recording with voiceover
**Tools:** OBS Studio, Loom, or QuickTime

---

## Script Structure

### Opening (30 seconds)

**Visual:** Show AgentOS logo/README on GitHub

**Voiceover:**
> "Hi! I'm excited to show you AgentOS - a production-ready operating system for AI agents, built entirely with Kiro as my AI pair programmer. In just 3 minutes, I'll show you how AgentOS provides everything you need to build intelligent agents with clean architecture and production-grade quality."

---

### Part 1: The Problem (30 seconds)

**Visual:** Show messy code structure, tangled dependencies diagram

**Voiceover:**
> "Building AI agents today is challenging. Developers face tangled dependencies, inconsistent architectures, and fragile systems. AgentOS solves this by providing six core systems that work together seamlessly."

---

### Part 2: Core Systems Overview (45 seconds)

**Visual:** Show project structure in VS Code, navigate through folders

**Voiceover:**
> "AgentOS includes six production-ready systems: An event-driven architecture for loose coupling, a plugin system with hot-reloading, five distinct AI personalities that adapt to context, persistent state management, automated quality evaluation, and automatic ADR generation. All with 393 tests and 89% code coverage."

**Screen Actions:**
- Open `src/core/` folder
- Quickly show each system folder
- Show test results: `npm test`

---

### Part 3: Live Demo - Discord Bot (60 seconds)

**Visual:** Terminal + Discord app side-by-side

**Voiceover:**
> "Let me show you a real application. This Discord bot uses AgentOS's personality system to adapt its responses based on context."

**Screen Actions:**
1. Show Discord bot code: `src/apps/discord-bot/bot.ts`
2. Start the bot: `npm start`
3. Switch to Discord
4. Type: `!hello` - Show helpful personality
5. Type: `!stats` - Show analytical personality
6. Type: `!help` - Show efficient personality

**Voiceover (during demo):**
> "Notice how the bot's personality changes based on the command. The helpful personality for greetings, analytical for stats, and efficient for help commands. This is all automatic based on context patterns."

---

### Part 4: Live Demo - CI/CD Automator (60 seconds)

**Visual:** Terminal showing CI/CD automator

**Voiceover:**
> "Now let's see the CI/CD automator. This tool runs quality gates and generates Architecture Decision Records automatically."

**Screen Actions:**
1. Show automator code: `src/apps/cicd-automator/automator.ts`
2. Run: `npm run cicd`
3. Show output:
   - Quality gate checks
   - Baseline comparison
   - ADR generation
4. Open generated ADR file

**Voiceover (during demo):**
> "The automator runs our eval suite, compares against baselines, and blocks if quality drops more than 5%. It also detects interface changes and generates comprehensive ADRs automatically. This is production-ready quality automation."

---

### Part 5: The Kiro Advantage (45 seconds)

**Visual:** Show `.kiro/` folder structure, specs, steering docs

**Voiceover:**
> "Here's what makes this special - we built all of this with Kiro. Seven detailed specifications guided the development. Kiro generated 13,900 lines of code, wrote all 393 tests, and created comprehensive documentation. The steering documents ensure consistent architecture and quality standards."

**Screen Actions:**
1. Show `.kiro/specs/` folder
2. Open one spec file briefly
3. Show `.kiro/steering/` folder
4. Show test coverage report

---

### Part 6: Results & Impact (30 seconds)

**Visual:** Show metrics dashboard or README stats section

**Voiceover:**
> "The results speak for themselves: 393 tests with 100% pass rate, 89% code coverage, zero 'any' types for full type safety, and two production-ready applications. All built in two weeks with Kiro as my AI pair programmer."

**Screen Actions:**
- Show test results
- Show coverage report
- Show TypeScript strict mode config

---

### Closing (30 seconds)

**Visual:** Return to README, show GitHub repo

**Voiceover:**
> "AgentOS demonstrates what's possible when human creativity meets AI assistance. It's not just a hackathon project - it's a production-ready foundation for the next generation of AI agents. Check out the code on GitHub, try the examples, and see how Kiro can transform your development workflow. Thanks for watching!"

**Screen Actions:**
- Show GitHub URL
- Show README with quick start instructions
- End with AgentOS logo

---

## Recording Checklist

### Before Recording
- [ ] Clean up desktop/browser tabs
- [ ] Close unnecessary applications
- [ ] Set terminal to readable font size (14-16pt)
- [ ] Prepare Discord test server
- [ ] Have all files ready to open
- [ ] Test audio levels
- [ ] Practice run-through (2-3 times)

### Terminal Setup
```bash
# Set larger font
# Use clear, readable theme
# Prepare commands in advance:

# Terminal 1 - Discord Bot
cd src/apps/discord-bot
npm start

# Terminal 2 - CI/CD Automator
cd src/apps/cicd-automator
npm run cicd

# Terminal 3 - Tests
npm test
npm run coverage
```

### Files to Have Open
1. `README.md`
2. `src/core/` folder structure
3. `src/apps/discord-bot/bot.ts`
4. `src/apps/cicd-automator/automator.ts`
5. `.kiro/specs/` folder
6. Test results

### Recording Settings
- **Resolution:** 1920x1080 (1080p)
- **Frame Rate:** 30 fps minimum
- **Audio:** Clear voiceover, no background noise
- **Format:** MP4 (H.264)
- **Length:** 3-5 minutes (DevPost limit)

---

## Alternative: Quick Demo (2 minutes)

If you need a shorter version:

### Quick Script

**Opening (15s):**
> "AgentOS - a production-ready OS for AI agents, built with Kiro."

**Core Systems (30s):**
> "Six integrated systems: events, plugins, personalities, state, quality eval, and ADR generation. 393 tests, 89% coverage."

**Live Demo (60s):**
> "Here's a Discord bot using personality switching..." [Show bot demo]
> "And a CI/CD automator with quality gates..." [Show automator]

**Kiro Impact (15s):**
> "All built with Kiro - 13,900 lines of code, comprehensive tests, and documentation."

**Closing (10s):**
> "Production-ready foundation for AI agents. Check it out on GitHub!"

---

## Video Upload Options

### Recommended Platforms
1. **YouTube** (Unlisted or Public)
   - Best quality
   - Easy embedding
   - No time limits

2. **Vimeo**
   - Professional appearance
   - Good quality
   - Free tier: 500MB/week

3. **Loom**
   - Easy recording
   - Quick sharing
   - 5-minute limit on free tier

### Upload Steps
1. Record video following script
2. Edit if needed (trim, add captions)
3. Upload to platform
4. Set to Public or Unlisted
5. Copy video URL
6. Paste into DevPost form

---

## Pro Tips

### Visual Tips
- **Zoom in** on important code sections
- **Highlight** key lines with cursor
- **Pause briefly** after showing each feature
- **Use smooth transitions** between sections
- **Show real output**, not just code

### Audio Tips
- **Speak clearly** and at moderate pace
- **Emphasize** key numbers (393 tests, 89% coverage)
- **Show enthusiasm** but stay professional
- **Pause** between sections
- **End strong** with call to action

### Editing Tips
- Add **text overlays** for key stats
- Include **timestamps** in description
- Add **captions** for accessibility
- Keep **transitions smooth**
- **Cut dead air** and mistakes

---

## Sample Video Description

```
AgentOS - Production-Ready Operating System for AI Agents

Built entirely with Kiro IDE, AgentOS provides six core systems for building intelligent agents:
- Event-driven architecture
- Plugin system with hot-reloading
- 5 AI personalities with context switching
- Persistent state management
- Automated quality evaluation
- Automatic ADR generation

📊 Stats:
- 13,900+ lines of code
- 393 tests (100% pass rate)
- 89% code coverage
- 0 'any' types (full type safety)
- 2 production-ready applications

🔗 Links:
- GitHub: https://github.com/kloudfy/agentos
- Documentation: See README.md
- Try it: npm install && npm test

⏱️ Timestamps:
0:00 - Introduction
0:30 - Core Systems Overview
1:15 - Discord Bot Demo
2:15 - CI/CD Automator Demo
3:00 - Kiro Development Process
3:45 - Results & Closing

Built with ❤️ using Kiro IDE
#Kiroween #AIAgents #TypeScript #ProductionReady
```

---

## Need Help?

### Can't Record Video?
Create a **slide deck** with:
- Screenshots of key features
- Code snippets
- Test results
- Architecture diagrams
- Record narration over slides

### Technical Issues?
- Use **Loom** for easiest recording
- **OBS Studio** for advanced features
- **QuickTime** (Mac) for simple screen recording
- **Windows Game Bar** (Win+G) for Windows

### Time Constraints?
Focus on:
1. Quick intro (15s)
2. One live demo (60s)
3. Test results (30s)
4. Closing (15s)
Total: 2 minutes

---

Good luck with your video! 🎥
