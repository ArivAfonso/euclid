<template>
  <div class="flex h-full flex-col bg-white dark:bg-[hsl(0,0%,9%)] border-r border-border/50">
    <div class="flex-1 overflow-y-auto px-3 py-3">
      <div class="space-y-2.5">
        <!-- Files Section -->
        <div class="space-y-2 border border-border/50 rounded-md p-2.5 bg-muted/20">
          <div class="flex items-center justify-between mb-1">
            <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide select-none">
              <div class="w-1.5 h-1.5 bg-red-600 rounded-sm"></div>
              Files
            </h3>
          </div>
          
          <FileInput :accept="fileAccept" @change="handleFileUpload">
            <div
              class="relative flex h-20 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-md border border-dashed border-border bg-muted/30 text-center transition-all hover:border-primary hover:bg-background"
              role="button"
              tabindex="0"
            >
              <IconUpload class="size-5" />
              <span class="text-xs font-medium text-muted-foreground">Upload File</span>
              <div
                v-if="isUploading"
                class="absolute inset-0 flex items-center justify-center rounded-md bg-background/80"
              >
                <Loader2 class="size-5 animate-spin text-primary" />
              </div>
            </div>
          </FileInput>
        </div>

        <Separator />

        <!-- Drawing Section -->
        <div class="space-y-2 border border-border/50 rounded-md p-2.5 bg-muted/20">
          <div class="flex items-center justify-between mb-1">
            <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide select-none">
              <div class="w-1.5 h-1.5 bg-red-600 rounded-sm"></div>
              Drawing
            </h3>
          </div>
          
          <div class="grid grid-cols-3 gap-1.5">
            <TooltipProvider v-for="brush in brushStyles" :key="brush.id">
              <Tooltip>
                <TooltipTrigger as-child>
                  <button
                    type="button"
                    class="relative flex h-[74px] flex-col items-center justify-center gap-1 rounded-md border px-1.5 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    :class="activeBrush === brush.id
                      ? 'border-primary/70 bg-primary/10 text-primary ring-1 ring-primary/30'
                      : 'border-border/60 bg-background/40 text-muted-foreground hover:border-primary/40 hover:bg-muted/40 hover:text-foreground'"
                    :aria-pressed="activeBrush === brush.id"
                    @click="enableDrawing(brush.id)"
                  >
                    <component :is="brush.icon" class="size-3.5 shrink-0" />
                    <span class="text-[10px] font-semibold leading-none">{{ brush.label }}</span>

                    <!-- Live stroke preview: reacts to the brush width slider -->
                    <svg class="mt-0.5 h-4 w-full" viewBox="0 0 64 20" fill="none" aria-hidden="true">
                      <path
                        v-if="brush.id === 'pencil'"
                        :d="pencilPreviewPath"
                        stroke="currentColor"
                        :stroke-width="pencilPreviewWidth"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        opacity="0.9"
                      />
                      <template v-else-if="brush.id === 'circle'">
                        <circle
                          v-for="(dot, index) in previewWavePoints"
                          :key="index"
                          :cx="dot.x"
                          :cy="dot.y"
                          :r="circlePreviewRadius"
                          fill="currentColor"
                          opacity="0.85"
                        />
                      </template>
                      <template v-else>
                        <circle
                          v-for="(dot, index) in sprayPreviewDots"
                          :key="index"
                          :cx="dot.x"
                          :cy="dot.y"
                          :r="dot.r * sprayPreviewScale"
                          fill="currentColor"
                          :opacity="dot.opacity"
                        />
                      </template>
                    </svg>

                    <span
                      v-if="activeBrush === brush.id"
                      class="absolute right-1 top-1 size-1.5 rounded-full bg-primary"
                    />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" class="text-xs">
                  <p class="font-medium">{{ brush.label }} brush</p>
                  <p class="text-muted-foreground">{{ brush.hint }}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <Label class="text-xs font-medium text-muted-foreground">Brush Width</Label>
              <Badge variant="outline" class="text-[10px] px-1.5 py-0 select-none">{{ brushWidth }}px</Badge>
            </div>
            <SliderWithTicks
              :model-value="[brushWidth]"
              :min="1"
              :max="50"
              :step="1"
              :show-ticks="true"
              :tick-step="10"
              :integer-labels="true"
              @update:model-value="(value) => { if (value?.[0] !== undefined) brushWidth = value[0] }"
              class="w-full"
            />
          </div>

          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <Label class="text-xs font-medium text-muted-foreground">Brush Color</Label>
            </div>
            <div class="flex items-center gap-2">
              <Popover>
                <PopoverTrigger as-child>
                  <Button
                    variant="outline"
                    class="h-8 flex-1 justify-start px-2 transition-all"
                    @click.stop
                  >
                    <div class="flex items-center gap-2">
                      <div class="w-4 h-4 rounded border border-border" :style="{ backgroundColor: brushColor }"></div>
                      <span class="text-[11px] font-mono">{{ toHex(brushColor) }}</span>
                    </div>
                  </Button>
                </PopoverTrigger>
                <PopoverContent class="w-[256px]" align="end">
                  <ColorPicker v-model="brushColor" />
                </PopoverContent>
              </Popover>
              <Button 
                variant="destructive" 
                size="sm" 
                class="h-8 px-2 text-[10px]"
                @click="disableDrawing"
                v-if="activeBrush"
              >
                Stop
              </Button>
            </div>
          </div>
        </div>

        <Separator />

        <!-- Text Section -->
        <div class="space-y-2 border border-border/50 rounded-md p-2.5 bg-muted/20">
          <div class="flex items-center justify-between mb-1">
            <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide select-none">
              <div class="w-1.5 h-1.5 bg-red-600 rounded-sm"></div>
              Text
            </h3>
          </div>
          
          <div class="grid grid-cols-3 gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger as-child>
                  <Button variant="outline" class="h-14 flex-col gap-1 transition-all hover:bg-primary/10" @click="drawText(80)">
                    <IconH1 class="size-3.5" />
                    <span class="text-[10px] font-medium">Title</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" class="text-xs">
                  <p>Add Title (80px)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger as-child>
                  <Button variant="outline" class="h-14 flex-col gap-1 transition-all hover:bg-primary/10" @click="drawText(60)">
                    <Heading2 class="size-3.5" />
                    <span class="text-[10px] font-medium">Subtitle</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" class="text-xs">
                  <p>Add Subtitle (60px)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger as-child>
                  <Button variant="outline" class="h-14 flex-col gap-1 transition-all hover:bg-primary/10" @click="drawText(36)">
                    <Pilcrow class="size-3.5" />
                    <span class="text-[10px] font-medium">Body</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" class="text-xs">
                  <p>Add Body Text (36px)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger as-child>
                  <Button variant="outline" class="h-14 flex-col gap-1 transition-all hover:bg-primary/10" @click="drawVerticalText(36)">
                    <ArrowDownAZ class="size-3.5" />
                    <span class="text-[10px] font-medium">Vertical</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" class="text-xs">
                  <p>Add Vertical Text</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger as-child>
                  <Button variant="outline" class="h-14 flex-col gap-1 transition-all hover:bg-primary/10" @click="drawText(36, undefined, true)">
                    <TypeOutline class="size-3.5" />
                    <span class="text-[10px] font-medium">Hollow</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" class="text-xs">
                  <p>Add Hollow Text</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger as-child>
                  <Button variant="outline" class="h-14 flex-col gap-1 transition-all hover:bg-primary/10" @click="drawArcText">
                    <Rainbow class="size-3.5" />
                    <span class="text-[10px] font-medium">Arc</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" class="text-xs">
                  <p>Add Arc Text</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        <Separator />

        <!-- Module Section -->
        <div class="space-y-2 border border-border/50 rounded-md p-2.5 bg-muted/20">
          <div class="flex items-center justify-between mb-1">
            <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide select-none">
              <div class="w-1.5 h-1.5 bg-red-600 rounded-sm"></div>
              Module
            </h3>
            <Badge variant="outline" class="text-[10px] px-1.5 py-0 select-none">Components</Badge>
          </div>
          
          <div class="grid grid-cols-3 gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger as-child>
                  <Button variant="outline" class="h-14 flex-col gap-1 transition-all hover:bg-primary/10" @click="createBarElement">
                    <IconPayCodeTwo class="size-3.5" />
                    <span class="text-[10px] font-medium">Barcode</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" class="text-xs">
                  <p>Generate Barcode</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger as-child>
                  <Button variant="outline" class="h-14 flex-col gap-1 transition-all hover:bg-primary/10" @click="openQRCodeDialog">
                    <IconTwoDimensionalCodeTwo class="size-3.5" />
                    <span class="text-[10px] font-medium">QR Code</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" class="text-xs">
                  <p>Generate QR Code</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger as-child>
                  <Button variant="outline" class="h-14 flex-col gap-1 transition-all hover:bg-primary/10" @click="openMathDialog">
                    <IconMathFormula class="size-3.5" />
                    <span class="text-[10px] font-medium">Math</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" class="text-xs">
                  <p>Math Formula</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Math Formula Dialog -->
    <Dialog v-model:open="isMathDialogOpen">
      <DialogContent class="sm:max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader class="border-b pb-2">
          <DialogTitle class="text-2xl text-foreground font-extralight flex items-center gap-2" style="font-family: 'Editorial New', serif;">
            <div class="w-2 h-2 bg-red-600 rounded-sm"></div>
            Math Formula
          </DialogTitle>
          <DialogDescription class="text-xs">
            Enter LaTeX expression · Live preview · Customize appearance
          </DialogDescription>
        </DialogHeader>
        
        <div class="flex-1 overflow-y-auto space-y-3 py-3">
          <!-- Expression Input & Preview in Grid -->
          <div class="grid grid-cols-2 gap-3">
            <!-- Left: Expression Input -->
            <div class="space-y-1.5">
              <div class="flex items-center justify-between">
                <Label class="text-[10px] font-bold uppercase tracking-wide text-foreground">Expression</Label>
                <Badge variant="secondary" class="text-[9px] px-1 py-0">LaTeX</Badge>
              </div>
              <Textarea
                v-model="mathExpression"
                placeholder="E = mc^2"
                class="font-mono text-[11px] min-h-[120px] resize-none"
              />
            </div>
            
            <!-- Right: Preview -->
            <div class="space-y-1.5">
              <div class="flex items-center justify-between">
                <Label class="text-[10px] font-bold uppercase tracking-wide text-foreground">Preview</Label>
                <Badge 
                  :variant="mathExpression.trim() ? 'default' : 'outline'" 
                  class="text-[9px] px-1 py-0"
                >
                  {{ mathExpression.trim() ? 'Ready' : 'Empty' }}
                </Badge>
              </div>
              <div 
                class="border border-border/50 rounded-md p-3 min-h-[120px] bg-muted/20 flex items-center justify-center text-sm"
                v-html="mathPreviewHtml"
              ></div>
            </div>
          </div>
          
          <!-- Settings Section -->
          <div class="space-y-2 border border-border/50 rounded-md p-2.5 bg-muted/20">
            <div class="flex items-center gap-1.5 mb-1.5">
              <div class="w-1 h-1 bg-cyan-500 rounded-sm"></div>
              <Label class="text-[10px] font-bold uppercase tracking-wide">Settings</Label>
            </div>
            
            <div class="grid grid-cols-2 gap-3">
              <!-- Font Size -->
              <div class="space-y-1.5">
                <div class="flex items-center justify-between">
                  <Label class="text-[10px] text-muted-foreground">Size</Label>
                  <Badge variant="outline" class="text-[10px] px-1.5 py-0 select-none">{{ mathFontSize[0] }}px</Badge>
                </div>
                <div class="flex items-center gap-2">
                  <Slider
                    v-model="mathFontSize"
                    :min="12"
                    :max="120"
                    :step="2"
                    class="flex-1"
                  />
                </div>
              </div>
              
              <!-- Color -->
              <div class="space-y-1.5">
                <Label class="text-[10px] text-muted-foreground">Color</Label>
                <div class="flex items-center gap-2">
                  <Input
                    type="color"
                    v-model="mathColor"
                    class="h-8 w-12 p-0.5 cursor-pointer"
                  />
                  <Badge variant="outline" class="text-[10px] px-2 py-0 font-mono">
                    {{ mathColor }}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Quick Reference Section -->
          <div class="space-y-2 border border-border/50 rounded-md p-2.5 bg-muted/20">
            <div class="flex items-center gap-1.5 mb-1.5">
              <div class="w-1 h-1 bg-orange-500 rounded-sm"></div>
              <Label class="text-[10px] font-bold uppercase tracking-wide">Quick Insert</Label>
            </div>
            
            <div class="grid grid-cols-4 gap-1.5 text-[10px]">
              <Button
                variant="outline"
                size="sm"
                class="h-8 font-mono text-[9px] px-1.5"
                @click="insertMathSyntax('\\frac{a}{b}')"
              >
                frac
              </Button>
              <Button
                variant="outline"
                size="sm"
                class="h-8 font-mono text-[9px] px-1.5"
                @click="insertMathSyntax('\\sqrt{x}')"
              >
                sqrt
              </Button>
              <Button
                variant="outline"
                size="sm"
                class="h-8 font-mono text-[9px] px-1.5"
                @click="insertMathSyntax('\\sum_{i}^{n}')"
              >
                sum
              </Button>
              <Button
                variant="outline"
                size="sm"
                class="h-8 font-mono text-[9px] px-1.5"
                @click="insertMathSyntax('\\int_{a}^{b}')"
              >
                int
              </Button>
              <Button
                variant="outline"
                size="sm"
                class="h-8 font-mono text-[9px] px-1.5"
                @click="insertMathSyntax('x^{2}')"
              >
                power
              </Button>
              <Button
                variant="outline"
                size="sm"
                class="h-8 font-mono text-[9px] px-1.5"
                @click="insertMathSyntax('x_{i}')"
              >
                sub
              </Button>
              <Button
                variant="outline"
                size="sm"
                class="h-8 font-mono text-[9px] px-1.5"
                @click="insertMathSyntax('\\alpha')"
              >
                greek
              </Button>
              <Button
                variant="outline"
                size="sm"
                class="h-8 font-mono text-[9px] px-1.5"
                @click="insertMathSyntax('\\lim')"
              >
                lim
              </Button>
              <Button
                variant="outline"
                size="sm"
                class="h-8 font-mono text-[9px] px-1.5"
                @click="insertMathSyntax('\\begin{pmatrix}\\end{pmatrix}')"
              >
                matrix
              </Button>
              <Button
                variant="outline"
                size="sm"
                class="h-8 font-mono text-[9px] px-1.5"
                @click="insertMathSyntax('\\frac{\\partial}{\\partial x}')"
              >
                deriv
              </Button>
              <Button
                variant="outline"
                size="sm"
                class="h-8 font-mono text-[9px] px-1.5"
                @click="insertMathSyntax('\\pm')"
              >
                ±
              </Button>
              <Button
                variant="outline"
                size="sm"
                class="h-8 font-mono text-[9px] px-1.5"
                @click="insertMathSyntax('\\infty')"
              >
                ∞
              </Button>
            </div>
          </div>
        </div>
        
        <DialogFooter class="border-t pt-2">
          <Button variant="outline" size="sm" @click="isMathDialogOpen = false">Cancel</Button>
          <Button 
            size="sm" 
            @click="createMathFormula"
            :disabled="!mathExpression.trim()"
          >
            Insert Formula
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- QR Code Dialog -->
    <Dialog v-model:open="isQRDialogOpen">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Generate QR Code</DialogTitle>
          <DialogDescription>
            Customize your QR code appearance and content
          </DialogDescription>
        </DialogHeader>
        
        <div class="space-y-4 py-4">
          <div class="space-y-2">
            <Label class="text-xs font-bold uppercase">Content</Label>
            <Input
              v-model="codeContent"
              placeholder="Enter URL or text"
              class="text-sm"
            />
          </div>
          
          <div class="space-y-2">
            <Label class="text-xs font-bold uppercase">Style</Label>
            <Select v-model="selectedQRStyle">
              <SelectTrigger class="text-sm border border-input">
                <SelectValue placeholder="Select style" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Basic Styles</SelectLabel>
                  <SelectItem value="A1">Square</SelectItem>
                  <SelectItem value="A2">Rounded</SelectItem>
                  <SelectItem value="A3">Random Round</SelectItem>
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel>Special Styles</SelectLabel>
                  <SelectItem value="SP1">DSJ</SelectItem>
                  <SelectItem value="SP2">Random Rect</SelectItem>
                  <SelectItem value="SP3">Circle</SelectItem>
                  <SelectItem value="B1">3D</SelectItem>
                  <SelectItem value="C1">Image</SelectItem>
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel>Line Styles</SelectLabel>
                  <SelectItem value="A_a1">Line 1</SelectItem>
                  <SelectItem value="A_a2">Line 2</SelectItem>
                  <SelectItem value="A_b1">Function A</SelectItem>
                  <SelectItem value="A_b2">Function B</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label class="text-xs font-bold uppercase">Error Level</Label>
              <Select v-model="codeError">
                <SelectTrigger class="text-sm border border-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Low (7%)</SelectItem>
                  <SelectItem value="1">Medium (15%)</SelectItem>
                  <SelectItem value="2">Quartile (25%)</SelectItem>
                  <SelectItem value="3">High (30%)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div class="space-y-2">
              <Label class="text-xs font-bold uppercase flex items-center gap-2">
                Spacing
                <Switch v-model:checked="codeSpace" />
              </Label>
              <div class="text-xs text-muted-foreground pt-2">
                {{ codeSpace ? 'Enabled' : 'Disabled' }}
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" @click="isQRDialogOpen = false">Cancel</Button>
          <Button @click="generateCustomQRCode">Generate</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <svg
      id="barcode"
      class="sr-only absolute h-0 w-0"
      aria-hidden="true"
      focusable="false"
    ></svg>
  </div>
</template>

<script lang="ts" setup>
import { onUnmounted, ref, watch } from 'vue'
import { ArrowDownAZ, CircleDot, Heading2, Loader2, PencilLine, Pilcrow, Rainbow, SprayCan, TypeOutline } from 'lucide-vue-next'
import * as fabric from 'fabric'
import { nanoid } from 'nanoid'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import SliderWithTicks from '@/components/ui/slider/SliderWithTicks.vue'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import FileInput from '@/components/FileInput.vue'
import { toHex } from '@/utils/color'
import { toast } from '@/components/ui/toast'
import { encodeData, renderer25D, rendererRect, rendererRound, rendererRandRound, rendererDSJ, rendererRandRect, rendererImage, rendererCircle, rendererLine, rendererLine2, rendererFuncA, rendererFuncB, type CodeOption } from 'beautify-qrcode'
import JsBarCode from 'jsbarcode'
import { QRCodeType, Template } from '@/types/canvas'
import type { LinePoolItem, PathPoolItem } from '@/types/elements'
import { loadSVGFromString } from 'fabric'
import useCanvasScale from '@/hooks/useCanvasScale'
import useHandleCreate from '@/hooks/useHandleCreate'
import useHandleTemplate from '@/hooks/useHandleTemplate'
import { getImageDataURL, getImageText } from '@/utils/image'

import useCanvas from '@/views/Canvas/useCanvas'
import PathSection from './MaterialComponents/PathSection.vue'
import LineSection from './MaterialComponents/LineSection.vue'
import { useTemplatesStore } from '@/store'


const { addTemplate } = useHandleTemplate()
const { setCanvasTransform } = useCanvasScale()
const templatesStore = useTemplatesStore()
const {
  createQRCodeElement,
  createBarCodeElement,
  createImageElement,
  createTextElement,
  createPathElement,
  createLineElement,
  createArcTextElement,
  createVerticalTextElement,
  createVideoElement,
  createMathElement,
} = useHandleCreate()

const fileAccept = '.pdf,.psd,.cdr,.ai,.svg,.jpg,.jpeg,.png,.webp,.gif,.json,.mp4'
const isUploading = ref(false)
const isQRDialogOpen = ref(false)
const isMathDialogOpen = ref(false)

const codeContent = ref<string>(window.location.href)
const codeSpace = ref(true)
const codeError = ref('0')
const selectedQRStyle = ref<QRCodeType>('A1')

// Math formula state
const mathExpression = ref('E = mc^2')
const mathColor = ref('#000000')
const mathFontSize = ref([48])
const mathPreviewHtml = ref('')

// Drawing brush state
type BrushType = 'pencil' | 'circle' | 'spray'

const activeBrush = ref<BrushType | null>(null)
const brushWidth = ref(10)
const brushColor = ref('#000000')

// Brush style picker
const brushStyles = [
  { id: 'pencil' as BrushType, label: 'Pencil', hint: 'Solid, pen-like stroke', icon: PencilLine },
  { id: 'circle' as BrushType, label: 'Circle', hint: 'Overlapping round dabs', icon: CircleDot },
  { id: 'spray' as BrushType, label: 'Spray', hint: 'Scattered airbrush specks', icon: SprayCan },
]

// Stroke previews: geometry is shared between the brushes so each card shows
// the same path drawn in its own style, and sizes react to the brush width.
const PREVIEW_SAMPLES = 15

const previewWavePoints = computed(() =>
  Array.from({ length: PREVIEW_SAMPLES }, (_, index) => {
    const t = index / (PREVIEW_SAMPLES - 1)
    return {
      x: Number((4 + t * 56).toFixed(2)),
      y: Number((10 + Math.sin(t * Math.PI * 1.6) * 4.5).toFixed(2)),
    }
  }),
)

const pencilPreviewPath = computed(() => {
  const points = previewWavePoints.value
  let path = `M ${points[0].x} ${points[0].y}`
  for (let i = 1; i < points.length - 1; i++) {
    const midX = (points[i].x + points[i + 1].x) / 2
    const midY = (points[i].y + points[i + 1].y) / 2
    path += ` Q ${points[i].x} ${points[i].y} ${midX.toFixed(2)} ${midY.toFixed(2)}`
  }
  const last = points[points.length - 1]
  return `${path} L ${last.x} ${last.y}`
})

const sprayPreviewDots = computed(() =>
  Array.from({ length: 46 }, (_, index) => {
    const t = index / 45
    const waveY = 10 + Math.sin(t * Math.PI * 1.6) * 4.5
    // Deterministic pseudo-random jitter so the specks look scattered
    const x = 4 + t * 56 + ((((index * 37) % 11) - 5) * 0.8)
    const y = waveY + ((((index * 53) % 13) - 6) * 0.7)
    return {
      x: Number(x.toFixed(2)),
      y: Number(y.toFixed(2)),
      r: Number((0.55 + ((index * 29) % 5) * 0.14).toFixed(2)),
      opacity: Number((0.4 + ((index * 17) % 5) * 0.12).toFixed(2)),
    }
  }),
)

const pencilPreviewWidth = computed(() => Math.max(1.2, Math.min(3.4, brushWidth.value / 5)))
const circlePreviewRadius = computed(() => Math.max(1.3, Math.min(3.1, brushWidth.value / 6.5)))
const sprayPreviewScale = computed(() => Math.max(0.6, Math.min(1.5, brushWidth.value / 12)))

let hasDrawingHistoryListener = false
const handlePathCreated = ({ path }: { path?: fabric.FabricObject }) => {
  if (!path) return
  if (!path.id) {
    path.set('id', nanoid(10))
  }
  templatesStore.addElement(path)
}

const registerDrawingHistory = (canvasInstance: fabric.Canvas) => {
  if (hasDrawingHistoryListener) return

  canvasInstance.on('path:created', handlePathCreated)
  hasDrawingHistoryListener = true
}

const generateQRCodeMap: Record<QRCodeType, (option: CodeOption) => string> = {
  A1: rendererRect,
  A2: rendererRound,
  A3: rendererRandRound,
  SP1: rendererDSJ,
  SP2: rendererRandRect,
  SP3: rendererCircle,
  B1: renderer25D,
  C1: rendererImage,
  A_a1: rendererLine,
  A_a2: rendererLine2,
  A_b1: rendererFuncA,
  A_b2: rendererFuncB,
}

const allowedExtensions = fileAccept.split(',').map(ext => ext.trim())

const handleFileUpload = async (files: FileList | File[]) => {
  const fileArray = Array.isArray(files) ? files : Array.from(files)
  const file = fileArray[0]
  if (!file)
    return

  const suffix = file.name.split('.').pop()?.toLowerCase()
  if (!suffix || !allowedExtensions.includes(`.${suffix}`)) {
    toast({
      variant: 'destructive',
      title: 'Unsupported file type',
      description: `.${suffix ?? 'unknown'} files are not supported.`,
    })
    return
  }

  const [canvas] = useCanvas()
  isUploading.value = true
  try {
    if (suffix === 'svg') {
      const dataText = await getImageText(file)
      const content = await loadSVGFromString(dataText)
      canvas.add(...(content.objects as any))
      canvas.renderAll()
    }
    else if (suffix === 'json') {
      const dataText = await getImageText(file)
      const template = JSON.parse(dataText)
      await addTemplate(template)
    }
    else if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(suffix)) {
      const dataURL = await getImageDataURL(file)
      createImageElement(dataURL)
    }
    else if (suffix === 'mp4') {
      const dataURL = URL.createObjectURL(file)
      createVideoElement(dataURL)
    }

  }
  catch (error) {
    const description = error instanceof Error ? error.message : 'Unknown error'
    toast({
      variant: 'destructive',
      title: 'Upload failed',
      description,
    })
  }
  finally {
    isUploading.value = false
    canvas.renderAll()
  }
}

const getCodeOption = (width = 118, height = 118): CodeOption => {
  return {
    text: codeContent.value,
    width,
    height,
    correctLevel: Number(codeError.value),
    isSpace: codeSpace.value,
  }
}

const getEncodeData = (width = 118, height = 118) => {
  const codeOption = getCodeOption(width, height)
  return encodeData(codeOption)
}

const createBarElement = () => {
  const codeOption: JsBarCode.BaseOptions = {
    format: 'pharmacode',
    lineColor: '#0aa',
    width: 4,
    height: 40,
    displayValue: false,
  }
  JsBarCode('#barcode', '1234', codeOption)
  const barcode = document.getElementById('barcode')
  if (!barcode) return
  const serialized = new XMLSerializer().serializeToString(barcode)
  const src = `data:image/svg+xml;base64,${btoa(serialized)}`
  createBarCodeElement(src, '1234', codeOption)
}

const openQRCodeDialog = () => {
  isQRDialogOpen.value = true
}

const createQRElement = (style: QRCodeType) => {
  const codeOption = getCodeOption(118, 118)
  // beautify-qrcode renderers expect the ENCODED qrcode instance (returned by
  // encodeData), not the raw options object — passing options directly throws
  // "Cannot read properties of undefined (reading 'width')" and leaves the
  // dialog hanging without creating an element.
  const encoded = encodeData(codeOption)
  if (!encoded) return
  const svgString = generateQRCodeMap[style](encoded)
  const src = `data:image/svg+xml;base64,${btoa(svgString)}`
  const qrOption = {
    codeStyle: style,
    codeSpace: codeSpace.value,
    codeError: Number(codeError.value),
  }
  createQRCodeElement(src, qrOption, codeContent.value)
}

const generateCustomQRCode = () => {
  createQRElement(selectedQRStyle.value)
  isQRDialogOpen.value = false
}

const drawText = (fontSize: number, textStyle: 'transverse' | 'direction' = 'transverse', textHollow = false) => {
  createTextElement(fontSize, textStyle, textHollow)
}

const drawArcText = () => {
  createArcTextElement(36)
}

const drawVerticalText = (fontSize: number) => {
  createVerticalTextElement(fontSize)
}

const drawPath = (shape: PathPoolItem) => {
  createPathElement(shape.path)
}

const drawLine = (line: LinePoolItem) => {
  const strokeDashArray: [number, number] | undefined = line.style === 'dashed' ? [6, 6] : undefined
  createLineElement(
    line.data,
    line.points[0],
    line.points[1],
    strokeDashArray,
    Boolean(line.isCurve),
    Boolean(line.isCubic),
  )
}

// Math formula functions
const openMathDialog = () => {
  mathExpression.value = 'E = mc^2'
  mathColor.value = '#000000'
  mathFontSize.value = [48]
  updateMathPreview()
  isMathDialogOpen.value = true
}

const insertMathSyntax = (syntax: string) => {
  mathExpression.value += syntax
  updateMathPreview()
}

const updateMathPreview = async () => {
  try {
    const katex = await import('katex')
    mathPreviewHtml.value = katex.default.renderToString(mathExpression.value || 'x = y', {
      throwOnError: false,
      displayMode: true,
      output: 'html'
    })
  } catch (error) {
    mathPreviewHtml.value = '<span style="color: red;">Invalid expression</span>'
  }
}

const createMathFormula = async () => {
  if (!mathExpression.value.trim()) {
    toast({
      variant: 'destructive',
      title: 'Empty expression',
      description: 'Please enter a mathematical expression',
    })
    return
  }
  
  try {
    await createMathElement(mathExpression.value, mathColor.value, mathFontSize.value[0])
    isMathDialogOpen.value = false
    toast({
      title: 'Math formula added',
      description: 'Your mathematical expression has been added to the canvas',
    })
  } catch (error) {
    toast({
      variant: 'destructive',
      title: 'Failed to create formula',
      description: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

// Watch for math expression changes to update preview
watch(mathExpression, () => {
  updateMathPreview()
})

// Enable drawing mode with different brush types
const enableDrawing = (brushType: BrushType) => {
  const [canvasInstance] = useCanvas()
  if (!canvasInstance) {
    console.error('Canvas is not initialized')
    return
  }

  registerDrawingHistory(canvasInstance)
  
  activeBrush.value = brushType
  canvasInstance.isDrawingMode = true
  
  // Create appropriate brush based on type
  if (brushType === 'pencil') {
    canvasInstance.freeDrawingBrush = new fabric.PencilBrush(canvasInstance)
  } else if (brushType === 'circle') {
    canvasInstance.freeDrawingBrush = new fabric.CircleBrush(canvasInstance)
  } else {
    canvasInstance.freeDrawingBrush = new fabric.SprayBrush(canvasInstance)
  }
  
  // Set brush properties
  if (canvasInstance.freeDrawingBrush) {
    canvasInstance.freeDrawingBrush.color = brushColor.value
    canvasInstance.freeDrawingBrush.width = brushWidth.value

    if (brushType === 'spray' && canvasInstance.freeDrawingBrush instanceof fabric.SprayBrush) {
      canvasInstance.freeDrawingBrush.density = Math.max(10, brushWidth.value * 2)
      canvasInstance.freeDrawingBrush.dotWidth = Math.max(1, brushWidth.value / 6)
      canvasInstance.freeDrawingBrush.dotWidthVariance = Math.max(1, brushWidth.value / 8)
    }
  }
  
  toast({
    title: `${brushType.charAt(0).toUpperCase() + brushType.slice(1)} brush enabled`,
    description: 'Click "Stop" button or press ESC to exit drawing mode',
  })
}

// Disable drawing mode
const disableDrawing = () => {
  const [canvasInstance] = useCanvas()
  if (!canvasInstance) return
  
  canvasInstance.isDrawingMode = false
  activeBrush.value = null
  
  toast({
    title: 'Drawing mode disabled',
    description: 'You can now select and edit objects',
  })
}

// Watch brush properties and update active brush
watch([brushWidth, brushColor], () => {
  const [canvasInstance] = useCanvas()
  if (canvasInstance?.freeDrawingBrush && activeBrush.value) {
    canvasInstance.freeDrawingBrush.color = brushColor.value
    canvasInstance.freeDrawingBrush.width = brushWidth.value

    if (activeBrush.value === 'spray' && canvasInstance.freeDrawingBrush instanceof fabric.SprayBrush) {
      canvasInstance.freeDrawingBrush.density = Math.max(10, brushWidth.value * 2)
      canvasInstance.freeDrawingBrush.dotWidth = Math.max(1, brushWidth.value / 6)
      canvasInstance.freeDrawingBrush.dotWidthVariance = Math.max(1, brushWidth.value / 8)
    }
  }
})

onUnmounted(() => {
  const [canvasInstance] = useCanvas()
  if (!canvasInstance) return
  if (hasDrawingHistoryListener) {
    canvasInstance.off('path:created', handlePathCreated)
    hasDrawingHistoryListener = false
  }
  canvasInstance.isDrawingMode = false
})
</script>
