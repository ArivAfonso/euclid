<template>
  <div class="space-y-2 border border-border/50 rounded-md p-2.5 bg-muted/20">
    <div class="flex items-center justify-between mb-1">
      <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide select-none">
        <div class="w-1.5 h-1.5 bg-red-600 rounded-sm"></div>
        Image Effects
      </h3>
      <Badge variant="outline" class="text-[10px] px-1.5 py-0 select-none">{{ activeEffectsCount }} Active</Badge>
    </div>

    <!-- All Effects -->
    <div class="grid grid-cols-2 gap-1.5">
      <EffectCard 
        v-for="effect in allEffects" 
        :key="effect.id"
        :effect="effect"
        :is-active="isEffectActive(effect.type)"
        @toggle="toggleEffect(effect)"
      />
    </div>

    <Separator class="my-2" />

    <!-- Active Effects List -->
    <div v-if="activeEffects.length > 0" class="space-y-1.5">
      <Label class="text-[10px] font-bold uppercase tracking-wide">Active Effects</Label>
      <div class="space-y-1">
        <div 
          v-for="effect in activeEffects" 
          :key="effect.type"
          class="flex items-center justify-between p-1.5 rounded bg-background/50 border border-border/30"
        >
          <div class="flex items-center gap-2">
            <div class="w-1.5 h-1.5 bg-cyan-500 rounded-full"></div>
            <span class="text-[10px] font-medium">{{ getEffectName(effect.type) }}</span>
          </div>
          <div class="flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger as-child>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    class="h-5 w-5"
                    @click="openEffectSettings(getEffectConfig(effect.type))"
                  >
                    <IconSettings class="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" class="text-xs">
                  <p>Settings</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger as-child>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    class="h-5 w-5 hover:bg-destructive/10 hover:text-destructive"
                    @click="removeEffect(effect.type)"
                  >
                    <IconClose class="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" class="text-xs">
                  <p>Remove</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
    </div>

    <!-- Effect Settings Dialog -->
    <Dialog v-model:open="settingsDialogOpen">
      <DialogContent class="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle class="text-2xl text-foreground font-extralight flex items-center gap-2" style="font-family: 'Editorial New', serif;">
            <div class="w-2 h-2 bg-red-600 rounded-sm"></div>
            {{ currentEffectConfig?.name }} Settings
          </DialogTitle>
          <DialogDescription class="text-xs text-muted-foreground">
            {{ currentEffectConfig?.description }}
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-4 py-4" v-if="currentEffect">
          <!-- Intensity Slider (Common to all effects) -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <Label class="text-xs">Intensity</Label>
              <span class="text-[10px] font-mono">{{ currentEffect.intensity }}%</span>
            </div>
            <SliderWithTicks 
              :model-value="[currentEffect.intensity]" 
              @update:model-value="(val) => val && (currentEffect!.intensity = val[0])"
              :min="0" 
              :max="100" 
              :step="1" 
            />
          </div>

          <!-- Pixelize Settings -->
          <template v-if="currentEffect.type === 'pixelize'">
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <Label class="text-xs">Block Size</Label>
                <span class="text-[10px] font-mono">{{ (currentEffect as PixelizeEffect).blockSize }}px</span>
              </div>
              <SliderWithTicks 
                :model-value="[(currentEffect as PixelizeEffect).blockSize]" 
                @update:model-value="(val) => val && ((currentEffect as PixelizeEffect).blockSize = val[0])"
                :min="2" 
                :max="50" 
                :step="1" 
              />
            </div>
          </template>

          <!-- Radial Pixel Settings -->
          <template v-if="currentEffect.type === 'radialPixel'">
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <Label class="text-xs">Segments</Label>
                <span class="text-[10px] font-mono">{{ (currentEffect as RadialPixelEffect).segments }}</span>
              </div>
              <SliderWithTicks 
                :model-value="[(currentEffect as RadialPixelEffect).segments]" 
                @update:model-value="(val) => val && ((currentEffect as RadialPixelEffect).segments = val[0])"
                :min="4" 
                :max="64" 
                :step="1" 
              />
            </div>
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <Label class="text-xs">Rings</Label>
                <span class="text-[10px] font-mono">{{ (currentEffect as RadialPixelEffect).rings }}</span>
              </div>
              <SliderWithTicks 
                :model-value="[(currentEffect as RadialPixelEffect).rings]" 
                @update:model-value="(val) => val && ((currentEffect as RadialPixelEffect).rings = val[0])"
                :min="4" 
                :max="32" 
                :step="1" 
              />
            </div>
          </template>


          <!-- Cross Cut Settings -->
          <template v-if="currentEffect.type === 'crossCut'">
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <Label class="text-xs">Slices</Label>
                <span class="text-[10px] font-mono">{{ (currentEffect as CrossCutEffect).slices }}</span>
              </div>
              <SliderWithTicks 
                :model-value="[(currentEffect as CrossCutEffect).slices]" 
                @update:model-value="(val) => val && ((currentEffect as CrossCutEffect).slices = val[0])"
                :min="2" 
                :max="20" 
                :step="1" 
              />
            </div>
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <Label class="text-xs">Offset</Label>
                <span class="text-[10px] font-mono">{{ (currentEffect as CrossCutEffect).offset }}%</span>
              </div>
              <SliderWithTicks 
                :model-value="[(currentEffect as CrossCutEffect).offset]" 
                @update:model-value="(val) => val && ((currentEffect as CrossCutEffect).offset = val[0])"
                :min="0" 
                :max="100" 
                :step="1" 
              />
            </div>
            <div class="space-y-2">
              <Label class="text-xs">Direction</Label>
              <Select v-model="(currentEffect as CrossCutEffect).direction">
                <SelectTrigger class="h-7 text-[11px] border border-input hover:bg-accent">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="horizontal" class="text-xs py-1">Horizontal</SelectItem>
                  <SelectItem value="vertical" class="text-xs py-1">Vertical</SelectItem>
                  <SelectItem value="both" class="text-xs py-1">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </template>

          <!-- Liquid Settings -->
          <template v-if="currentEffect.type === 'liquid'">
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <Label class="text-xs">Amplitude</Label>
                <span class="text-[10px] font-mono">{{ (currentEffect as LiquidEffect).amplitude }}</span>
              </div>
              <SliderWithTicks 
                :model-value="[(currentEffect as LiquidEffect).amplitude]" 
                @update:model-value="(val) => val && ((currentEffect as LiquidEffect).amplitude = val[0])"
                :min="0" 
                :max="100" 
                :step="1" 
              />
            </div>
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <Label class="text-xs">Frequency</Label>
                <span class="text-[10px] font-mono">{{ (currentEffect as LiquidEffect).frequency }}</span>
              </div>
              <SliderWithTicks 
                :model-value="[(currentEffect as LiquidEffect).frequency]" 
                @update:model-value="(val) => val && ((currentEffect as LiquidEffect).frequency = val[0])"
                :min="1" 
                :max="20" 
                :step="1" 
              />
            </div>
          </template>

          <!-- Posterize Settings -->
          <template v-if="currentEffect.type === 'posterize'">
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <Label class="text-xs">Color Levels</Label>
                <span class="text-[10px] font-mono">{{ (currentEffect as PosterizeEffect).levels }}</span>
              </div>
              <SliderWithTicks 
                :model-value="[(currentEffect as PosterizeEffect).levels]" 
                @update:model-value="(val) => val && ((currentEffect as PosterizeEffect).levels = val[0])"
                :min="2" 
                :max="16" 
                :step="1" 
              />
            </div>
          </template>

          <!-- TV Glitch Settings -->
          <template v-if="currentEffect.type === 'tvGlitch'">
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <Label class="text-xs">Distortion</Label>
                <span class="text-[10px] font-mono">{{ (currentEffect as TvGlitchEffect).distortion }}%</span>
              </div>
              <SliderWithTicks 
                :model-value="[(currentEffect as TvGlitchEffect).distortion]" 
                @update:model-value="(val) => val && ((currentEffect as TvGlitchEffect).distortion = val[0])"
                :min="0" 
                :max="100" 
                :step="1" 
              />
            </div>
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <Label class="text-xs">Color Shift</Label>
                <span class="text-[10px] font-mono">{{ (currentEffect as TvGlitchEffect).colorShift }}px</span>
              </div>
              <SliderWithTicks 
                :model-value="[(currentEffect as TvGlitchEffect).colorShift]" 
                @update:model-value="(val) => val && ((currentEffect as TvGlitchEffect).colorShift = val[0])"
                :min="0" 
                :max="50" 
                :step="1" 
              />
            </div>
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <Label class="text-xs">Noise</Label>
                <span class="text-[10px] font-mono">{{ (currentEffect as TvGlitchEffect).noise }}%</span>
              </div>
              <SliderWithTicks 
                :model-value="[(currentEffect as TvGlitchEffect).noise]" 
                @update:model-value="(val) => val && ((currentEffect as TvGlitchEffect).noise = val[0])"
                :min="0" 
                :max="100" 
                :step="1" 
              />
            </div>
            <div class="flex items-center gap-2">
              <Checkbox 
                id="scanlines"
                v-model:checked="(currentEffect as TvGlitchEffect).scanlines"
              />
              <Label for="scanlines" class="text-xs cursor-pointer">Enable Scanlines</Label>
            </div>
          </template>


          <!-- Dot Pattern Settings -->
          <template v-if="currentEffect.type === 'dotPattern'">
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <Label class="text-xs">Dot Size</Label>
                <span class="text-[10px] font-mono">{{ (currentEffect as DotPatternEffect).dotSize }}px</span>
              </div>
              <SliderWithTicks 
                :model-value="[(currentEffect as DotPatternEffect).dotSize]" 
                @update:model-value="(val) => val && ((currentEffect as DotPatternEffect).dotSize = val[0])"
                :min="1" 
                :max="20" 
                :step="1" 
              />
            </div>
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <Label class="text-xs">Spacing</Label>
                <span class="text-[10px] font-mono">{{ (currentEffect as DotPatternEffect).spacing }}px</span>
              </div>
              <SliderWithTicks 
                :model-value="[(currentEffect as DotPatternEffect).spacing]" 
                @update:model-value="(val) => val && ((currentEffect as DotPatternEffect).spacing = val[0])"
                :min="1" 
                :max="20" 
                :step="1" 
              />
            </div>
            <div class="space-y-2">
              <Label class="text-xs">Shape</Label>
              <Select v-model="(currentEffect as DotPatternEffect).shape">
                <SelectTrigger class="h-7 text-[11px] border border-input hover:bg-accent">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="circle" class="text-xs py-1">Circle</SelectItem>
                  <SelectItem value="square" class="text-xs py-1">Square</SelectItem>
                  <SelectItem value="diamond" class="text-xs py-1">Diamond</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </template>

          <!-- Halftone Settings -->
          <template v-if="currentEffect.type === 'halftone'">
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <Label class="text-xs">Dot Size</Label>
                <span class="text-[10px] font-mono">{{ (currentEffect as HalftoneEffect).dotSize }}px</span>
              </div>
              <SliderWithTicks 
                :model-value="[(currentEffect as HalftoneEffect).dotSize]" 
                @update:model-value="(val) => val && ((currentEffect as HalftoneEffect).dotSize = val[0])"
                :min="1" 
                :max="20" 
                :step="1" 
              />
            </div>
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <Label class="text-xs">Angle</Label>
                <span class="text-[10px] font-mono">{{ (currentEffect as HalftoneEffect).angle }}°</span>
              </div>
              <SliderWithTicks 
                :model-value="[(currentEffect as HalftoneEffect).angle]" 
                @update:model-value="(val) => val && ((currentEffect as HalftoneEffect).angle = val[0])"
                :min="0" 
                :max="180" 
                :step="1" 
              />
            </div>
            <div class="space-y-2">
              <Label class="text-xs">Shape</Label>
              <Select v-model="(currentEffect as HalftoneEffect).shape">
                <SelectTrigger class="h-7 text-[11px] border border-input hover:bg-accent">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="circle" class="text-xs py-1">Circle</SelectItem>
                  <SelectItem value="ellipse" class="text-xs py-1">Ellipse</SelectItem>
                  <SelectItem value="square" class="text-xs py-1">Square</SelectItem>
                  <SelectItem value="line" class="text-xs py-1">Line</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </template>


          <!-- Outliner Settings -->
          <template v-if="currentEffect.type === 'outliner'">
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <Label class="text-xs">Threshold</Label>
                <span class="text-[10px] font-mono">{{ (currentEffect as OutlinerEffect).threshold }}</span>
              </div>
              <SliderWithTicks 
                :model-value="[(currentEffect as OutlinerEffect).threshold]" 
                @update:model-value="(val) => val && ((currentEffect as OutlinerEffect).threshold = val[0])"
                :min="0" 
                :max="255" 
                :step="1" 
              />
            </div>
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <Label class="text-xs">Thickness</Label>
                <span class="text-[10px] font-mono">{{ (currentEffect as OutlinerEffect).thickness }}px</span>
              </div>
              <SliderWithTicks 
                :model-value="[(currentEffect as OutlinerEffect).thickness]" 
                @update:model-value="(val) => val && ((currentEffect as OutlinerEffect).thickness = val[0])"
                :min="1" 
                :max="10" 
                :step="1" 
              />
            </div>
            <div class="flex items-center gap-2">
              <Checkbox 
                id="invert"
                v-model:checked="(currentEffect as OutlinerEffect).invert"
              />
              <Label for="invert" class="text-xs cursor-pointer">Invert</Label>
            </div>
          </template>

          <!-- Mirror Settings -->
          <template v-if="currentEffect.type === 'mirror'">
            <div class="space-y-2">
              <Label class="text-xs">Axis</Label>
              <Select v-model="(currentEffect as MirrorEffect).axis">
                <SelectTrigger class="h-7 text-[11px] border border-input hover:bg-accent">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="horizontal" class="text-xs py-1">Horizontal</SelectItem>
                  <SelectItem value="vertical" class="text-xs py-1">Vertical</SelectItem>
                  <SelectItem value="quad" class="text-xs py-1">Quad (Kaleidoscope)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <Label class="text-xs">Offset</Label>
                <span class="text-[10px] font-mono">{{ (currentEffect as MirrorEffect).offset }}%</span>
              </div>
              <SliderWithTicks 
                :model-value="[(currentEffect as MirrorEffect).offset]" 
                @update:model-value="(val) => val && ((currentEffect as MirrorEffect).offset = val[0])"
                :min="0" 
                :max="100" 
                :step="1" 
              />
            </div>
          </template>

          <!-- Vignette Settings -->
          <template v-if="currentEffect.type === 'vignette'">
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <Label class="text-xs">Size</Label>
                <span class="text-[10px] font-mono">{{ (currentEffect as VignetteEffect).size }}%</span>
              </div>
              <SliderWithTicks 
                :model-value="[(currentEffect as VignetteEffect).size]" 
                @update:model-value="(val) => val && ((currentEffect as VignetteEffect).size = val[0])"
                :min="0" 
                :max="100" 
                :step="1" 
              />
            </div>
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <Label class="text-xs">Softness</Label>
                <span class="text-[10px] font-mono">{{ (currentEffect as VignetteEffect).softness }}%</span>
              </div>
              <SliderWithTicks 
                :model-value="[(currentEffect as VignetteEffect).softness]" 
                @update:model-value="(val) => val && ((currentEffect as VignetteEffect).softness = val[0])"
                :min="0" 
                :max="100" 
                :step="1" 
              />
            </div>
            <div class="space-y-2">
              <Label class="text-xs">Color</Label>
              <Popover>
                <PopoverTrigger as-child>
                  <Button variant="outline" class="w-full h-8 justify-start gap-2 hover:bg-accent hover:text-accent-foreground">
                    <div 
                      class="w-4 h-4 rounded border" 
                      :style="{ backgroundColor: (currentEffect as VignetteEffect).color }"
                    ></div>
                    <span class="text-xs font-mono">{{ (currentEffect as VignetteEffect).color }}</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent class="w-[256px]" align="end">
                  <ColorPicker 
                    :modelValue="(currentEffect as VignetteEffect).color" 
                    @update:modelValue="(color: string) => (currentEffect as VignetteEffect).color = color" 
                  />
                </PopoverContent>
              </Popover>
            </div>
          </template>

          <!-- Duotone Settings -->
          <template v-if="currentEffect.type === 'duotone'">
            <div class="space-y-2">
              <Label class="text-xs">Highlight Color</Label>
              <Popover>
                <PopoverTrigger as-child>
                  <Button variant="outline" class="w-full h-8 justify-start gap-2 hover:bg-accent hover:text-accent-foreground">
                    <div 
                      class="w-4 h-4 rounded border" 
                      :style="{ backgroundColor: (currentEffect as DuotoneEffect).highlightColor }"
                    ></div>
                    <span class="text-xs font-mono">{{ (currentEffect as DuotoneEffect).highlightColor }}</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent class="w-[256px]" align="end">
                  <ColorPicker 
                    :modelValue="(currentEffect as DuotoneEffect).highlightColor" 
                    @update:modelValue="(color: string) => (currentEffect as DuotoneEffect).highlightColor = color" 
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div class="space-y-2">
              <Label class="text-xs">Shadow Color</Label>
              <Popover>
                <PopoverTrigger as-child>
                  <Button variant="outline" class="w-full h-8 justify-start gap-2 hover:bg-accent hover:text-accent-foreground">
                    <div 
                      class="w-4 h-4 rounded border" 
                      :style="{ backgroundColor: (currentEffect as DuotoneEffect).shadowColor }"
                    ></div>
                    <span class="text-xs font-mono">{{ (currentEffect as DuotoneEffect).shadowColor }}</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent class="w-[256px]" align="end">
                  <ColorPicker 
                    :modelValue="(currentEffect as DuotoneEffect).shadowColor" 
                    @update:modelValue="(color: string) => (currentEffect as DuotoneEffect).shadowColor = color" 
                  />
                </PopoverContent>
              </Popover>
            </div>
          </template>

          <!-- RGB Shift Settings -->
          <template v-if="currentEffect.type === 'rgbShift'">
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <Label class="text-xs">Amount</Label>
                <span class="text-[10px] font-mono">{{ (currentEffect as RgbShiftEffect).amount }}px</span>
              </div>
              <SliderWithTicks 
                :model-value="[(currentEffect as RgbShiftEffect).amount]" 
                @update:model-value="(val) => val && ((currentEffect as RgbShiftEffect).amount = val[0])"
                :min="0" 
                :max="50" 
                :step="1" 
              />
            </div>
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <Label class="text-xs">Angle</Label>
                <span class="text-[10px] font-mono">{{ (currentEffect as RgbShiftEffect).angle }}°</span>
              </div>
              <SliderWithTicks 
                :model-value="[(currentEffect as RgbShiftEffect).angle]" 
                @update:model-value="(val) => val && ((currentEffect as RgbShiftEffect).angle = val[0])"
                :min="0" 
                :max="360" 
                :step="1" 
              />
            </div>
          </template>

          <!-- Motion Blur Settings -->
          <template v-if="currentEffect.type === 'motionBlur'">
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <Label class="text-xs">Distance</Label>
                <span class="text-[10px] font-mono">{{ (currentEffect as MotionBlurEffect).distance }}px</span>
              </div>
              <SliderWithTicks 
                :model-value="[(currentEffect as MotionBlurEffect).distance]" 
                @update:model-value="(val) => val && ((currentEffect as MotionBlurEffect).distance = val[0])"
                :min="1" 
                :max="40" 
                :step="1" 
              />
            </div>
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <Label class="text-xs">Angle</Label>
                <span class="text-[10px] font-mono">{{ (currentEffect as MotionBlurEffect).angle }}°</span>
              </div>
              <SliderWithTicks 
                :model-value="[(currentEffect as MotionBlurEffect).angle]" 
                @update:model-value="(val) => val && ((currentEffect as MotionBlurEffect).angle = val[0])"
                :min="0" 
                :max="360" 
                :step="1" 
              />
            </div>
          </template>


          <!-- Scanlines Settings -->
          <template v-if="currentEffect.type === 'scanlines'">
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <Label class="text-xs">Density</Label>
                <span class="text-[10px] font-mono">{{ (currentEffect as ScanlinesEffect).density }}</span>
              </div>
              <SliderWithTicks 
                :model-value="[(currentEffect as ScanlinesEffect).density]" 
                @update:model-value="(val) => val && ((currentEffect as ScanlinesEffect).density = val[0])"
                :min="1" 
                :max="10" 
                :step="1" 
              />
            </div>
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <Label class="text-xs">Opacity</Label>
                <span class="text-[10px] font-mono">{{ (currentEffect as ScanlinesEffect).opacity }}%</span>
              </div>
              <SliderWithTicks 
                :model-value="[(currentEffect as ScanlinesEffect).opacity]" 
                @update:model-value="(val) => val && ((currentEffect as ScanlinesEffect).opacity = val[0])"
                :min="0" 
                :max="100" 
                :step="1" 
              />
            </div>
          </template>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" @click="settingsDialogOpen = false">Cancel</Button>
          <Button size="sm" @click="applyEffectSettings">Apply</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Apply All Effects Button -->
    <Button 
      v-if="activeEffects.length > 0"
      class="w-full h-8 text-xs"
      @click="applyAllEffects"
      :disabled="isProcessing"
    >
      <IconRefresh v-if="isProcessing" class="h-3.5 w-3.5 mr-2 animate-spin" />
      <IconCheck v-else class="h-3.5 w-3.5 mr-2" />
      {{ isProcessing ? 'Processing...' : 'Apply Effects' }}
    </Button>

    <!-- Clear All Button -->
    <Button 
      v-if="activeEffects.length > 0"
      variant="outline"
      class="w-full h-7 text-[10px]"
      @click="clearAllEffects"
    >
      Clear All Effects
    </Button>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useMainStore } from '@/store'
import { Image } from 'fabric'
import useCanvas from '@/views/Canvas/useCanvas'
import { IMAGE_EFFECTS, getEffectsByCategory, getEffectByType } from '@/configs/imageEffects'
import { imageEffectsProcessor } from '@/extension/effects/imageEffectsProcessor'
import type { 
  ImageEffect, 
  ImageEffectType,
  ImageEffectConfig,
  PixelizeEffect,
  RadialPixelEffect,
  CrossCutEffect,
  LiquidEffect,
  OutlinerEffect,
  DotPatternEffect,
  PosterizeEffect,
  TvGlitchEffect,
  HalftoneEffect,
  MirrorEffect,
  VignetteEffect,
  DuotoneEffect,
  RgbShiftEffect,
  MotionBlurEffect,
  ScanlinesEffect
} from '@/types/imageEffects'

import EffectCard from './EffectCard.vue'
import ColorPicker from '@/components/ColorPicker/index.vue'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import SliderWithTicks from '@/components/ui/slider/SliderWithTicks.vue'
import { Checkbox } from '@/components/ui/checkbox'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

const [canvas] = useCanvas()
const { canvasObject } = storeToRefs(useMainStore())
const handleElement = computed(() => canvasObject.value as Image)

// All effects combined
const allEffects = computed(() => [
  ...getEffectsByCategory('stylize'),
  ...getEffectsByCategory('distortion'),
  ...getEffectsByCategory('pattern'),
  ...getEffectsByCategory('color')
])

// Active effects on the current image
const activeEffects = ref<ImageEffect[]>([])
const activeEffectsCount = computed(() => activeEffects.value.length)

// Dialog state
const settingsDialogOpen = ref(false)
const currentEffectConfig = ref<ImageEffectConfig | null>(null)
const currentEffect = ref<ImageEffect | null>(null)

// Processing state
const isProcessing = ref(false)

// Original image data for reverting
const originalImageSrc = ref<string | null>(null)

const isEffectActive = (type: ImageEffectType) => {
  return activeEffects.value.some(e => e.type === type)
}

const getEffectName = (type: ImageEffectType) => {
  const config = getEffectByType(type)
  return config?.name || type
}

const getEffectConfig = (type: ImageEffectType) => {
  return IMAGE_EFFECTS.find(e => e.type === type) || null
}

const toggleEffect = (effectConfig: ImageEffectConfig) => {
  const existingIndex = activeEffects.value.findIndex(e => e.type === effectConfig.type)
  
  if (existingIndex >= 0) {
    // Remove effect
    activeEffects.value.splice(existingIndex, 1)
  } else {
    // Add effect with default settings
    const newEffect = {
      ...effectConfig.defaultSettings,
      type: effectConfig.type,
      enabled: true
    } as ImageEffect
    activeEffects.value.push(newEffect)
  }
}

const openEffectSettings = (effectConfig: ImageEffectConfig | null) => {
  if (!effectConfig) return
  
  currentEffectConfig.value = effectConfig
  
  // Find existing effect or create new one
  let effect = activeEffects.value.find(e => e.type === effectConfig.type)
  
  if (!effect) {
    effect = {
      ...effectConfig.defaultSettings,
      type: effectConfig.type,
      enabled: true
    } as ImageEffect
  }
  
  // Deep clone the effect for editing
  currentEffect.value = JSON.parse(JSON.stringify(effect))
  settingsDialogOpen.value = true
}

const applyEffectSettings = () => {
  if (!currentEffect.value) return
  
  const existingIndex = activeEffects.value.findIndex(e => e.type === currentEffect.value!.type)
  
  if (existingIndex >= 0) {
    activeEffects.value[existingIndex] = { ...currentEffect.value }
  } else {
    activeEffects.value.push({ ...currentEffect.value })
  }
  
  settingsDialogOpen.value = false
  
  // Auto-apply after settings change
  applyAllEffects()
}

const removeEffect = (type: ImageEffectType) => {
  const index = activeEffects.value.findIndex(e => e.type === type)
  if (index >= 0) {
    activeEffects.value.splice(index, 1)
  }
}

const clearAllEffects = async () => {
  activeEffects.value = []
  
  // Restore original image if available
  if (originalImageSrc.value && handleElement.value) {
    await handleElement.value.setSrc(originalImageSrc.value)
    canvas.renderAll()
  }
}

const applyAllEffects = async () => {
  if (!handleElement.value || activeEffects.value.length === 0) return
  
  isProcessing.value = true
  
  try {
    // Store original image source if not already stored
    if (!originalImageSrc.value) {
      originalImageSrc.value = handleElement.value.getSrc()
    }
    
    // Create an image element from the original source
    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = originalImageSrc.value!
    })
    
    // Apply all effects
    const resultImageData = await imageEffectsProcessor.applyEffects(img, activeEffects.value)
    
    // Convert to data URL and update the fabric image
    const dataUrl = imageEffectsProcessor.toDataURL(resultImageData)
    
    await handleElement.value.setSrc(dataUrl)
    canvas.renderAll()
    
  } catch (error) {
    console.error('Error applying effects:', error)
  } finally {
    isProcessing.value = false
  }
}
</script>

<style scoped>
</style>


