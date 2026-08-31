import { ref, computed } from 'vue'
import { nanoid } from 'nanoid'
import { useTemplatesStore, useMainStore } from '@/store'
import { storeToRefs } from 'pinia'
import useCanvas from '@/views/Canvas/useCanvas'
import useCenter from '@/views/Canvas/useCenter'
import { propertiesToInclude } from '@/configs/canvas'
import { Template } from '@/types/canvas'
import { yieldToPaint } from '@/utils/async'

export interface SavedProject {
  id: string
  name: string
  description: string
  width: number
  height: number
  thumbnail: string
  canvasData: Template[]
  created: number
  modified: number
  folderId?: string | null  // The folder this project belongs to (null = root)
}

export interface ProjectFolder {
  id: string
  name: string
  parentId: string | null  // Parent folder ID (null = root)
  created: number
  modified: number
  color?: string  // Optional folder color
}

const PROJECTS_STORAGE_KEY = 'NEXT_SAVED_PROJECTS'
const FOLDERS_STORAGE_KEY = 'NEXT_PROJECT_FOLDERS'

type FontStyle = 'normal' | 'italic'

interface FontRequest {
  family: string
  weight: number
  style: FontStyle
}

const FONT_WEIGHT_KEYWORDS: Record<string, number> = {
  thin: 100,
  extralight: 200,
  'extra-light': 200,
  ultralight: 200,
  'ultra-light': 200,
  light: 300,
  regular: 400,
  normal: 400,
  book: 350,
  medium: 500,
  semibold: 600,
  'semi-bold': 600,
  demibold: 600,
  'demi-bold': 600,
  bold: 700,
  extrabold: 800,
  'extra-bold': 800,
  ultrabold: 800,
  'ultra-bold': 800,
  heavy: 800,
  black: 900,
  extrablack: 950,
  'extra-black': 950,
  ultrablack: 950,
  'ultra-black': 950
}

const normalizeFontWeight = (weight: unknown): number => {
  if (typeof weight === 'number' && Number.isFinite(weight)) {
    return weight
  }

  const value = String(weight ?? '').trim().toLowerCase()
  const numeric = Number.parseInt(value, 10)

  if (Number.isFinite(numeric)) {
    return numeric
  }

  return FONT_WEIGHT_KEYWORDS[value] ?? 400
}

const normalizeFontStyle = (style: unknown): FontStyle => (
  String(style ?? '').trim().toLowerCase() === 'italic' ? 'italic' : 'normal'
)

const clampFontWeight = (weight: number): number => {
  if (!Number.isFinite(weight)) {
    return 400
  }
  const rounded = Math.round(weight / 50) * 50
  const snapped = Math.round(rounded / 100) * 100
  return Math.min(900, Math.max(100, snapped || 400))
}

const toVariantTag = (weight: number, style: FontStyle): string => {
  const safeWeight = clampFontWeight(weight)
  if (style === 'italic') {
    return safeWeight === 400 ? 'italic' : `${safeWeight}italic`
  }
  return safeWeight === 400 ? 'regular' : `${safeWeight}`
}

const collectTemplateFonts = (templates: Template[]): FontRequest[] => {
  const fonts = new Map<string, FontRequest>()

  const collectFromObjects = (objects: Template['objects']) => {
    if (!Array.isArray(objects)) return

    objects.forEach((obj) => {
      if (!obj) return

      const type = typeof obj.type === 'string' ? obj.type.toLowerCase() : ''

      if (type === 'group' && Array.isArray((obj as any).objects)) {
        collectFromObjects((obj as any).objects as Template['objects'])
      }

      if (type === 'textbox' || type === 'text' || type === 'i-text') {
        const family = (obj as any).fontFamily as string | undefined
        if (!family) return

        const weight = normalizeFontWeight((obj as any).fontWeight)
        const style = normalizeFontStyle((obj as any).fontStyle)
        const key = `${family}::${weight}::${style}`

        if (!fonts.has(key)) {
          fonts.set(key, { family, weight, style })
        }
      }
    })
  }

  templates.forEach((template) => {
    collectFromObjects(template.objects)
  })

  return Array.from(fonts.values())
}

const loadFontsForTemplates = async (templates: Template[]) => {
  const mainStore = useMainStore()
  const fontRequests = collectTemplateFonts(templates)

  if (!fontRequests.length) return

  fontRequests.forEach(({ family, weight, style }) => {
    const variant = toVariantTag(weight, style)
    mainStore.ensureFontLoaded(family, variant)
  })

  if (typeof document === 'undefined' || !('fonts' in document)) return

  const fontLoadPromises = fontRequests.map(({ family, weight, style }) => {
    const safeWeight = clampFontWeight(weight)
    const descriptor = `${style} ${safeWeight} 16px "${family.replace(/"/g, '\\"')}"`

    try {
      return (document.fonts as FontFaceSet).load(descriptor)
    } catch (error) {
      console.warn('Unable to eagerly load font', { family, weight: safeWeight, style }, error)
      return Promise.resolve([])
    }
  })

  await Promise.allSettled(fontLoadPromises)
}

// ── Module-level cache to avoid redundant JSON.parse on every call ──
// Shared across all useProjects() instances
let _projectsCache: SavedProject[] | null = null
let _projectLoadRequest = 0

export default () => {
  const templatesStore = useTemplatesStore()

  // Get all saved projects from localStorage (with caching)
  const getSavedProjects = (): SavedProject[] => {
    try {
      if (_projectsCache) return _projectsCache
      const stored = localStorage.getItem(PROJECTS_STORAGE_KEY)
      const parsed: SavedProject[] = stored ? JSON.parse(stored) : []
      _projectsCache = Array.isArray(parsed) ? parsed : []
      return _projectsCache
    } catch (error) {
      console.error('Error loading projects:', error)
      return []
    }
  }

  // Invalidate projects cache (call after any mutation)
  const invalidateProjectsCache = () => {
    _projectsCache = null
  }

  // Save projects to localStorage (deferred to idle callback)
  const saveProjectsToStorage = (projects: SavedProject[], synchronous = false) => {
    // Update the in-memory cache synchronously — subsequent reads are instant
    _projectsCache = projects
    
    const write = () => {
      try {
        localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(_projectsCache ?? projects))
      } catch (error) {
        console.error('Error saving projects:', error)
      }
    }

    if (synchronous) {
      // Critical save (e.g. initial project creation) — write immediately so
      // the data survives navigation or tab close without waiting for idle callback
      write()
    } else if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(write, { timeout: 2000 })
    } else {
      // Fallback: setTimeout with a slight delay as a yield point
      setTimeout(write, 0)
    }
  }

  // Generate thumbnail from current canvas
  const generateThumbnail = async (): Promise<string> => {
    try {
      const [canvas] = useCanvas()
      const { currentTemplate } = storeToRefs(templatesStore)
      
      if (!canvas) {
        return ''
      }

      // Get the workspace bounds (only the actual canvas area, not the background)
      const { left, top, width, height } = useCenter()
      const zoom = canvas.getZoom()
      const viewportTransform = canvas.viewportTransform || [1, 0, 0, 1, 0, 0]

      // Store original background
      const originalBackground = canvas.backgroundColor

      // Set background to the workspace fill color for thumbnail
      // NOTE: toDataURL() calls renderAll() internally, so no explicit renderAll is needed here
      const workspaceFill = currentTemplate.value.workSpace?.fill || '#ffffff'
      canvas.backgroundColor = workspaceFill as any

      // Create a low-resolution thumbnail — toDataURL() is expensive and
      // blocks the main thread synchronously. We target at least ~400px wide
      // so small canvases (e.g. mobile) don't become tiny, pixelated images
      // on the projects page, while large canvases keep a ~30% scale so the
      // synchronous freeze duration stays bounded.
      const TARGET_THUMBNAIL_WIDTH = 400
      const multiplier = Math.max(0.3, TARGET_THUMBNAIL_WIDTH / width) / zoom
      const dataURL = canvas.toDataURL({
        format: 'jpeg',
        quality: 0.55,
        multiplier,
        left: left * zoom + viewportTransform[4],
        top: top * zoom + viewportTransform[5],
        width: width * zoom,
        height: height * zoom
      })

      // Restore original background (defer the render so it doesn't block)
      canvas.backgroundColor = originalBackground as any
      requestAnimationFrame(() => {
        canvas.renderAll()
      })
      
      return dataURL
    } catch (error) {
      console.error('Error generating thumbnail:', error)
      return ''
    }
  }

  // Save current project
  const saveProject = async (name: string, description: string = ''): Promise<SavedProject | null> => {
    try {
      const { templates, currentTemplate } = storeToRefs(templatesStore)
      const [canvas] = useCanvas()
      
      if (!canvas) {
        throw new Error('Canvas not initialized')
      }

      // Create a complete snapshot of all templates with their data
      const canvasData: Template[] = templates.value.map((template, index) => {
        // Get the canvas JSON for this template
        let templateData: any
        
        if (index === templatesStore.templateIndex) {
          // For current template, get live data from canvas
          templateData = canvas.toObject(propertiesToInclude)
        } else {
          // For other templates, use stored data
          templateData = {
            version: template.version || '6.7.1',
            objects: template.objects || [],
            background: template.background || 'rgba(255,255,255,0)'
          }
        }

        return {
          ...template,
          version: templateData.version || template.version || '6.7.1',
          objects: templateData.objects || template.objects || [],
          background: templateData.background || template.background || 'rgba(255,255,255,0)',
          workSpace: template.workSpace,
          zoom: template.zoom,
          width: template.width,
          height: template.height,
          clip: template.clip
        }
      })

      // Yield to paint so the "Saving..." indicator actually renders before
      // the synchronous canvas.toDataURL() freezes the main thread
      await yieldToPaint()

      const thumbnail = await generateThumbnail()
      const now = Date.now()

      const project: SavedProject = {
        id: nanoid(),
        name,
        description,
        width: currentTemplate.value.width,
        height: currentTemplate.value.height,
        thumbnail,
        canvasData,
        created: now,
        modified: now
      }

      const projects = getSavedProjects()
      projects.unshift(project) // Add to beginning
      saveProjectsToStorage(projects, true) // synchronous — must survive navigation

      return project
    } catch (error) {
      console.error('Error saving project:', error)
      return null
    }
  }

  // Update existing project
  const updateProject = async (projectId: string, updates: Partial<SavedProject>): Promise<boolean> => {
    try {
      const projects = getSavedProjects()
      const index = projects.findIndex(p => p.id === projectId)
      
      if (index === -1) {
        return false
      }

      // ── Phase 1: Canvas serialization ──
      if (updates.canvasData === undefined) {
        const { templates } = storeToRefs(templatesStore)
        const [canvas] = useCanvas()
        
        if (canvas) {
          const canvasData: Template[] = templates.value.map((template, idx) => {
            let templateData: any
            
            if (idx === templatesStore.templateIndex) {
              templateData = canvas.toObject(propertiesToInclude)
            } else {
              templateData = {
                version: template.version || '6.7.1',
                objects: template.objects || [],
                background: template.background || 'rgba(255,255,255,0)'
              }
            }

            return {
              ...template,
              version: templateData.version || template.version || '6.7.1',
              objects: templateData.objects || template.objects || [],
              background: templateData.background || template.background || 'rgba(255,255,255,0)',
              workSpace: template.workSpace,
              zoom: template.zoom,
              width: template.width,
              height: template.height,
              clip: template.clip
            }
          })
          
          updates.canvasData = canvasData
        }
      }

      // ── Phase 2: Persist to localStorage ──
      // NOTE: Thumbnail is NOT generated here — it's deferred to
      // generateAndSaveThumbnail(), called only when the user leaves the editor
      projects[index] = {
        ...projects[index],
        ...updates,
        modified: Date.now()
      }

      // Write synchronously — this is called on explicit user save or navigate-away,
      // so the data must survive navigation immediately
      saveProjectsToStorage(projects, true)
      return true
    } catch (error) {
      console.error('Error updating project:', error)
      return false
    }
  }

  // Generate and persist a thumbnail for a saved project.
  // Call this only when leaving the editor (navigating to projects list or closing).
  // This keeps the expensive canvas.toDataURL() call out of the editing hot-path.
  const generateAndSaveThumbnail = async (projectId: string): Promise<boolean> => {
    try {
      const projects = getSavedProjects()
      const index = projects.findIndex(p => p.id === projectId)
      if (index === -1) return false
      const thumbnail = await generateThumbnail()
      projects[index].thumbnail = thumbnail
      projects[index].modified = Date.now()
      saveProjectsToStorage(projects, true)
      return true
    } catch (error) {
      console.error('Error generating thumbnail:', error)
      return false
    }
  }

  // Load project into canvas
  const loadProject = async (projectId: string): Promise<boolean> => {
    const loadRequest = ++_projectLoadRequest

    try {
      const projects = getSavedProjects()
      const project = projects.find(p => p.id === projectId)
      
      if (!project) {
        console.error('Project not found:', projectId)
        return false
      }

      // Ensure canvas data is valid
      if (!project.canvasData || project.canvasData.length === 0) {
        console.error('Invalid project data')
        return false
      }

      // Validate that each template has the required structure
      const validatedData = project.canvasData.map(template => {
        // Ensure WorkSpaceDrawType object exists
        const hasWorkspace = template.objects?.some(obj => obj.id === 'WorkSpaceDrawType')
        
        if (!hasWorkspace && template.workSpace) {
          // Add WorkSpaceDrawType if missing
          const workspaceObj = {
            id: 'WorkSpaceDrawType',
            type: 'Rect',
            name: 'rect',
            width: template.width,
            height: template.height,
            fill: template.workSpace.fill || '#ffffff',
            selectable: false,
            evented: false,
            ...template.workSpace
          }
          
          template.objects = template.objects || []
          template.objects.unshift(workspaceObj as any)
        }

        return {
          ...template,
          version: template.version || '6.7.1',
          objects: template.objects || [],
          background: template.background || 'rgba(255,255,255,0)',
          workSpace: template.workSpace || {
            fillType: 0,
            left: 0,
            top: 0,
            angle: 0,
            scaleX: 1,
            scaleY: 1,
            fill: '#ffffff'
          },
          zoom: template.zoom || 1,
          width: template.width || 1920,
          height: template.height || 1080
        }
      })

      // Replace project state before waiting for fonts so the old project's
      // templates cannot be serialized into the new project during loading.
      templatesStore.replaceProjectTemplates(validatedData)
      const [canvas] = useCanvas()
      if (canvas) {
        canvas.discardActiveObject()
        canvas.clear()
        canvas.renderAll()
      }

      await loadFontsForTemplates(validatedData)
      // A newer navigation superseded this load while fonts were loading.
      if (loadRequest !== _projectLoadRequest) return true

      await templatesStore.renderTemplate()

      return true
    } catch (error) {
      console.error('Error loading project:', error)
      return false
    }
  }

  // Delete project
  const deleteProject = (projectId: string): boolean => {
    try {
      const projects = getSavedProjects()
      const filtered = projects.filter(p => p.id !== projectId)
      saveProjectsToStorage(filtered)
      return true
    } catch (error) {
      console.error('Error deleting project:', error)
      return false
    }
  }

  // Rename project
  const renameProject = (projectId: string, newName: string): boolean => {
    try {
      const projects = getSavedProjects()
      const index = projects.findIndex(p => p.id === projectId)
      
      if (index === -1) {
        return false
      }

      projects[index].name = newName
      projects[index].modified = Date.now()
      saveProjectsToStorage(projects)
      return true
    } catch (error) {
      console.error('Error renaming project:', error)
      return false
    }
  }

  // Get a single project
  const getProject = (projectId: string): SavedProject | null => {
    const projects = getSavedProjects()
    return projects.find(p => p.id === projectId) || null
  }

  // Move project to a folder
  const moveProjectToFolder = (projectId: string, folderId: string | null): boolean => {
    try {
      const projects = getSavedProjects()
      const index = projects.findIndex(p => p.id === projectId)
      
      if (index === -1) {
        return false
      }

      projects[index].folderId = folderId
      projects[index].modified = Date.now()
      saveProjectsToStorage(projects)
      return true
    } catch (error) {
      console.error('Error moving project to folder:', error)
      return false
    }
  }

  // Get projects in a specific folder
  const getProjectsInFolder = (folderId: string | null): SavedProject[] => {
    const projects = getSavedProjects()
    return projects.filter(p => (p.folderId || null) === folderId)
  }

  // ==================== FOLDER OPERATIONS ====================

  // Get all folders from localStorage
  const getFolders = (): ProjectFolder[] => {
    try {
      const stored = localStorage.getItem(FOLDERS_STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('Error loading folders:', error)
      return []
    }
  }

  // Save folders to localStorage
  const saveFoldersToStorage = (folders: ProjectFolder[]) => {
    try {
      localStorage.setItem(FOLDERS_STORAGE_KEY, JSON.stringify(folders))
    } catch (error) {
      console.error('Error saving folders:', error)
    }
  }

  // Create a new folder
  const createFolder = (name: string, parentId: string | null = null, color?: string): ProjectFolder | null => {
    try {
      const now = Date.now()
      const folder: ProjectFolder = {
        id: nanoid(),
        name,
        parentId,
        created: now,
        modified: now,
        color
      }

      const folders = getFolders()
      folders.push(folder)
      saveFoldersToStorage(folders)

      return folder
    } catch (error) {
      console.error('Error creating folder:', error)
      return null
    }
  }

  // Rename a folder
  const renameFolder = (folderId: string, newName: string): boolean => {
    try {
      const folders = getFolders()
      const index = folders.findIndex(f => f.id === folderId)
      
      if (index === -1) {
        return false
      }

      folders[index].name = newName
      folders[index].modified = Date.now()
      saveFoldersToStorage(folders)
      return true
    } catch (error) {
      console.error('Error renaming folder:', error)
      return false
    }
  }

  // Delete a folder and optionally its contents
  const deleteFolder = (folderId: string, deleteContents: boolean = false): boolean => {
    try {
      const folders = getFolders()
      const projects = getSavedProjects()

      // Get all descendant folder IDs (recursive)
      const getDescendantFolderIds = (parentId: string): string[] => {
        const children = folders.filter(f => f.parentId === parentId)
        let ids = children.map(f => f.id)
        children.forEach(child => {
          ids = ids.concat(getDescendantFolderIds(child.id))
        })
        return ids
      }

      const folderIdsToDelete = [folderId, ...getDescendantFolderIds(folderId)]

      if (deleteContents) {
        // Delete all projects in these folders
        const filteredProjects = projects.filter(p => !folderIdsToDelete.includes(p.folderId || ''))
        saveProjectsToStorage(filteredProjects)
      } else {
        // Move projects to root
        const updatedProjects = projects.map(p => {
          if (folderIdsToDelete.includes(p.folderId || '')) {
            return { ...p, folderId: null }
          }
          return p
        })
        saveProjectsToStorage(updatedProjects)
      }

      // Delete the folders
      const filteredFolders = folders.filter(f => !folderIdsToDelete.includes(f.id))
      saveFoldersToStorage(filteredFolders)

      return true
    } catch (error) {
      console.error('Error deleting folder:', error)
      return false
    }
  }

  // Move a folder to another folder
  const moveFolder = (folderId: string, newParentId: string | null): boolean => {
    try {
      const folders = getFolders()
      const index = folders.findIndex(f => f.id === folderId)
      
      if (index === -1) {
        return false
      }

      // Prevent moving a folder into itself or its descendants
      if (newParentId) {
        const getDescendantFolderIds = (parentId: string): string[] => {
          const children = folders.filter(f => f.parentId === parentId)
          let ids = children.map(f => f.id)
          children.forEach(child => {
            ids = ids.concat(getDescendantFolderIds(child.id))
          })
          return ids
        }

        const descendants = getDescendantFolderIds(folderId)
        if (descendants.includes(newParentId) || newParentId === folderId) {
          console.error('Cannot move folder into itself or its descendants')
          return false
        }
      }

      folders[index].parentId = newParentId
      folders[index].modified = Date.now()
      saveFoldersToStorage(folders)
      return true
    } catch (error) {
      console.error('Error moving folder:', error)
      return false
    }
  }

  // Get subfolders of a folder
  const getSubfolders = (parentId: string | null): ProjectFolder[] => {
    const folders = getFolders()
    return folders.filter(f => f.parentId === parentId)
  }

  // Get folder by ID
  const getFolder = (folderId: string): ProjectFolder | null => {
    const folders = getFolders()
    return folders.find(f => f.id === folderId) || null
  }

  // Get folder path (breadcrumb)
  const getFolderPath = (folderId: string | null): ProjectFolder[] => {
    if (!folderId) return []
    
    const folders = getFolders()
    const path: ProjectFolder[] = []
    let currentId: string | null = folderId

    while (currentId) {
      const folder = folders.find(f => f.id === currentId)
      if (folder) {
        path.unshift(folder)
        currentId = folder.parentId
      } else {
        break
      }
    }

    return path
  }

  // Update folder color
  const updateFolderColor = (folderId: string, color: string): boolean => {
    try {
      const folders = getFolders()
      const index = folders.findIndex(f => f.id === folderId)
      
      if (index === -1) {
        return false
      }

      folders[index].color = color
      folders[index].modified = Date.now()
      saveFoldersToStorage(folders)
      return true
    } catch (error) {
      console.error('Error updating folder color:', error)
      return false
    }
  }

  return {
    getSavedProjects,
    saveProject,
    updateProject,
    loadProject,
    deleteProject,
    renameProject,
    getProject,
    generateAndSaveThumbnail,
    invalidateProjectsCache,
    // Folder-related project operations
    moveProjectToFolder,
    getProjectsInFolder,
    // Folder operations
    getFolders,
    createFolder,
    renameFolder,
    deleteFolder,
    moveFolder,
    getSubfolders,
    getFolder,
    getFolderPath,
    updateFolderColor
  }
}
