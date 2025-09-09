# 🧠 Hemsy - AI Agent Context Guide

## 📖 **Essential Documents** (READ FIRST)

### 1. **Product Requirements Document**

```
@PRD.md
```

- **What**: Complete feature specifications, user flows, implementation roadmap
- **Key Sections**:
  - Section 3: Core Features
  - Section 12: Implementation Roadmap (Phases 0-7)
  - Section 4: User Flows & Navigation

### 2. **Architecture Specification**

```
@architecture.md
```

- **What**: System design, tech stack, data schemas, infrastructure
- **Key Sections**:
  - Section 5: Backend Architecture
  - Section 6: Data Layer & Schema
  - Section 7: External Integrations

## 🔧 **MCP Resources Available**

### Database Access

```
# Use Supabase MCP server for database queries
@supabase:tables
@supabase:schema
```

### File System Access

```
# Access project files directly
@filesystem:PRD.md
@filesystem:architecture.md
```

### GitHub Integration

```
# Available through global GitHub MCP server
- Repository management
- Issues and PRs
- Code search
- Workflow management
```

## 🎯 **Quick Context Checklist**

Before starting any task, ensure you understand:

- [ ] **What feature** am I working on? (Check PRD.md)
- [ ] **What phase** are we in? (Check PRD.md Section 12)
- [ ] **What's the data model?** (Check architecture.md Section 6)
- [ ] **What's the tech stack?** (Next.js 15+, TypeScript, MUI, Supabase)
- [ ] **Are there any feature flags?** (`trial_countdown_enabled`)
- [ ] **What are the architectural constraints?** (Mobile-first, offline-ready)

## 🚀 **Common Workflows**

### For Feature Development:

1. Read `@PRD.md` - Find the feature specification
2. Read `@architecture.md` - Understand data requirements
3. Check current codebase structure
4. Implement following mobile-first principles

### For Bug Fixes:

1. Understand the expected behavior from PRD
2. Check the data flow in architecture docs
3. Use GitHub MCP to search for related issues
4. Test on mobile viewport first

### For Database Changes:

1. Review schema in `architecture.md` Section 6
2. Use `@supabase:` MCP resources to check current state
3. Ensure RLS policies are maintained
4. Update migration files properly

## 📱 **Key Reminders**

- **Mobile-First**: Every UI must work on mobile screens first
- **Offline-Ready**: Handle slow/no network gracefully
- **Seamstress-Focused**: Features must match real workflow needs
- **Security**: All data access through Supabase RLS
- **Performance**: Load times must be under 2s on 3G

---

**💡 Pro Tip**: Always start with `@PRD.md` and `@architecture.md` to understand the full context before diving into code!
