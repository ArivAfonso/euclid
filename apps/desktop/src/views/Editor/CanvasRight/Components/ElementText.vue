<template>
  <div class="space-y-2" v-if="handlePathText">
    <!-- Font Selection -->
    <div class="space-y-2 border border-border/50 rounded-md p-2.5 bg-muted/20">
      <div class="flex items-center justify-between mb-1">
        <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide select-none">
          <div class=\"w-1.5 h-1.5 bg-red-600 rounded-sm\"></div>
          Font
        </h3>
      </div>
      
      <div class="grid grid-cols-2 gap-2">
        <Select>
          <SelectTrigger class="h-7 text-[11px] border border-input hover:bg-accent">
            <SelectValue placeholder="Select font" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0" class="text-xs py-1">Default</SelectItem>
          </SelectContent>
        </Select>
        
        <Select>
          <SelectTrigger class="h-7 text-[11px] border border-input hover:bg-accent">
            <SelectValue placeholder="Select size" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0" class="text-xs py-1">Default</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>

    <!-- Colors & Size -->
    <div class="space-y-2 border border-border/50 rounded-md p-2.5 bg-muted/20">
      <div class="flex items-center justify-between mb-1">
        <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide select-none">
          <div class="w-1.5 h-1.5 bg-red-600 rounded-sm"></div>
          Colors
        </h3>
      </div>
      
      <div class="grid grid-cols-4 gap-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger as-child>
              <Popover>
                <PopoverTrigger as-child>
                  <Button variant="outline" class="h-7 px-2 justify-start transition-all">
                    <div class="flex items-center gap-2">
                      <div class="w-4 h-4 rounded border border-border" :style="{ backgroundColor: fontColor }"></div>
                      <span class="text-xs font-mono">{{ toHex(fontColor) }}</span>
                    </div>
                  </Button>
                </PopoverTrigger>
                <PopoverContent class="w-[256px]" align="end">
                  <ColorPicker :modelValue="fontColor"/>
                </PopoverContent>
              </Popover>
            </TooltipTrigger>
            <TooltipContent><p>Text Color</p></TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger as-child>
              <Popover>
                <PopoverTrigger as-child>
                  <Button variant="outline" class="h-7 px-2 justify-start transition-all">
                    <div class="flex items-center gap-2">
                      <div class="w-4 h-4 rounded border border-border" :style="{ backgroundColor: fontColor }"></div>
                      <span class="text-xs font-mono">{{ toHex(fontColor) }}</span>
                    </div>
                  </Button>
                </PopoverTrigger>
                <PopoverContent class="w-[256px]" align="end">
                  <ColorPicker :modelValue="fontColor"/>
                </PopoverContent>
              </Popover>
            </TooltipTrigger>
            <TooltipContent><p>Highlight</p></TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger as-child>
              <Button variant="outline" class="h-7 px-2">
                <IconFontSize class="h-3.5 w-3.5 mr-0.5" />+
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Increase Size</p></TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger as-child>
              <Button variant="outline" class="h-7 px-2">
                <IconFontSize class="h-3.5 w-3.5 mr-0.5" />-
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Decrease Size</p></TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>

    <!-- Text Formatting -->
    <div class="space-y-2 border border-border/50 rounded-md p-2.5 bg-muted/20">
      <div class="flex items-center justify-between mb-1">
        <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide select-none">
          <div class="w-1.5 h-1.5 bg-red-600 rounded-sm"></div>
          Style
        </h3>
      </div>
      
      <div class="grid grid-cols-4 gap-1">
        <TooltipProvider v-for="(icon, idx) in [
          { component: 'IconTextBold', tooltip: 'Bold' },
          { component: 'IconTextItalic', tooltip: 'Italic' },
          { component: 'IconTextUnderline', tooltip: 'Underline' },
          { component: 'IconStrikethrough', tooltip: 'Strikethrough' }
        ]" :key="idx">
          <Tooltip>
            <TooltipTrigger as-child>
              <Button variant="outline" class="h-7 px-2">
                <component :is="icon.component" class="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>{{ icon.tooltip }}</p></TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>

    <!-- Formatting Tools -->
    <div class="space-y-2 border border-border/50 rounded-md p-2.5 bg-muted/20">
      <div class="flex items-center justify-between mb-1">
        <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide select-none">
          <div class="w-1.5 h-1.5 bg-red-600 rounded-sm"></div>
          Format
        </h3>
      </div>
      
      <div class="grid grid-cols-4 gap-1">
        <TooltipProvider v-for="(icon, idx) in [
          { component: 'IconFormat', tooltip: 'Clear Format' },
          { component: 'IconFormatBrush', tooltip: 'Format Painter' },
          { component: 'IconIndentLeft', tooltip: 'Decrease Indent' },
          { component: 'IconIndentRight', tooltip: 'Increase Indent' }
        ]" :key="idx">
          <Tooltip>
            <TooltipTrigger as-child>
              <Button variant="outline" class="h-7 px-2">
                <component :is="icon.component" class="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>{{ icon.tooltip }}</p></TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>

    <!-- Text Alignment -->
    <div class="space-y-2 border border-border/50 rounded-md p-2.5 bg-muted/20">
      <div class="flex items-center justify-between mb-1">
        <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide select-none">
          <div class="w-1.5 h-1.5 bg-red-600 rounded-sm"></div>
          Align
        </h3>
      </div>
      
      <div class="space-y-1">
        <div class="grid grid-cols-3 gap-1">
          <TooltipProvider v-for="(icon, idx) in [
            { component: 'IconAlignTextLeft', tooltip: 'Left' },
            { component: 'IconAlignTextCenter', tooltip: 'Center' },
            { component: 'IconAlignTextRight', tooltip: 'Right' }
          ]" :key="idx">
            <Tooltip>
              <TooltipTrigger as-child>
                <Button variant="outline" class="h-7 px-2">
                  <component :is="icon.component" class="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>{{ icon.tooltip }}</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <div class="grid grid-cols-3 gap-1">
          <TooltipProvider v-for="(icon, idx) in [
            { component: 'IconAlignTextTopOne', tooltip: 'Top' },
            { component: 'IconAlignTextMiddleOne', tooltip: 'Middle' },
            { component: 'IconAlignTextBottomOne', tooltip: 'Bottom' }
          ]" :key="idx">
            <Tooltip>
              <TooltipTrigger as-child>
                <Button variant="outline" class="h-7 px-2">
                  <component :is="icon.component" class="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>{{ icon.tooltip }}</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toHex } from '@/utils/color';

const fontColor = ref('#000')
const handlePathText = ref(true)
</script>

<style lang="scss" scoped>
</style>
