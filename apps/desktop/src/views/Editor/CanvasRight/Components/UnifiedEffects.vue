<template>
  <div class="space-y-2 border border-border/50 rounded-md p-2.5 bg-muted/20">
    <div class="flex items-center justify-between mb-1">
      <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide select-none">
        <div class="w-1.5 h-1.5 bg-red-600 rounded-sm"></div>
        Effects
      </h3>
      <Badge variant="outline" class="text-[10px] px-1.5 py-0 select-none">
        {{ totalActiveCount }} Active
      </Badge>
    </div>

    <template v-if="props.mode === 'compact'">
      <div class="space-y-1.5">
        <Button
          variant="outline"
          class="w-full h-8 text-xs font-medium justify-start gap-2 hover:bg-primary/10"
          @click="emit('open', 'filters')"
        >
          <Filter class="h-3 w-3 text-muted-foreground" />
          Filters
        </Button>
        <Button
          variant="outline"
          class="w-full h-8 text-xs font-medium justify-start gap-2 hover:bg-primary/10"
          @click="emit('open', 'effects')"
        >
          <Sparkles class="h-3 w-3 text-muted-foreground" />
          Effects
        </Button>
        <Button
          variant="outline"
          class="w-full h-8 text-xs font-medium justify-start gap-2 hover:bg-primary/10"
          @click="emit('open', 'adjust')"
        >
          <SlidersHorizontal class="h-3 w-3 text-muted-foreground" />
          Adjustments
        </Button>
      </div>
    </template>

    <Tabs v-else v-model="activeSection" class="w-full">
      <TabsList class="hidden" aria-hidden="true">
        <TabsTrigger value="filters">Filters</TabsTrigger>
        <TabsTrigger value="effects">Effects</TabsTrigger>
        <TabsTrigger value="adjust">Adjust</TabsTrigger>
      </TabsList>

      <!-- FILTERS TAB - Simple Color Presets -->
      <TabsContent value="filters" class="mt-2 space-y-2">
        <div class="grid grid-cols-2 gap-1.5">
          <button
            v-for="preset in colorPresets"
            :key="preset.id"
            type="button"
            :aria-pressed="activePreset === preset.id"
            @click="applyColorPreset(preset.id)"
            :class="[
              'relative h-16 rounded-md border overflow-hidden transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
              activePreset === preset.id 
                ? 'border-primary ring-2 ring-primary/30' 
                : 'border-border/50 hover:border-border hover:-translate-y-0.5 hover:shadow-md'
            ]"
          >
            <img
              :src="preset.preview"
              alt=""
              class="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
              draggable="false"
            />
            <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent"></div>
            <div class="absolute inset-x-0 bottom-0 p-1">
              <span class="text-[9px] font-semibold text-white drop-shadow-sm">{{ preset.name }}</span>
            </div>
            <div v-if="activePreset === preset.id" class="absolute top-1 right-1">
              <div class="w-3 h-3 bg-primary rounded-full flex items-center justify-center">
                <IconCheckOne class="w-2 h-2 text-primary-foreground" />
              </div>
            </div>
          </button>
        </div>
        
        <Button 
          v-if="activePreset && activePreset !== 'none'" 
          variant="ghost" 
          size="sm" 
          class="w-full h-7 text-[10px]"
          @click="clearColorPreset"
        >
          <IconClose class="w-3 h-3 mr-1" /> Clear Filter
        </Button>
      </TabsContent>

      <!-- EFFECTS TAB - Advanced Image Effects -->
      <TabsContent value="effects" class="mt-2 space-y-2">
        <!-- All Effects in One Group -->
        <div class="grid grid-cols-2 gap-1.5">
          <EffectCard 
            v-for="effect in allEffects" 
            :key="effect.id"
            :effect="effect"
            :is-active="isEffectActive(effect.type)"
            @toggle="toggleEffect(effect)"
          />
        </div>

        <!-- Active Effects List with Inline Controls -->
        <div v-if="activeEffects.length > 0" class="space-y-3 pt-2 border-t border-border/30">
          <div class="flex items-center justify-between">
            <Label class="text-[10px] font-bold uppercase tracking-wide">Active Effects</Label>
            <Button variant="ghost" size="sm" class="h-5 text-[9px] px-1.5" @click="clearAllEffects">
              Clear All
            </Button>
          </div>
          <div class="active-effects-controls space-y-2.5">
            <div 
              v-for="effect in activeEffects" 
              :key="effect.type"
              class="p-2 rounded bg-background/50 border border-border/30 space-y-3"
            >
              <!-- Effect Header -->
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <div class="w-1.5 h-1.5 bg-cyan-500 rounded-full"></div>
                  <span class="text-[10px] font-medium">{{ getEffectName(effect.type) }}</span>
                </div>
                <div class="flex items-center gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    class="h-5 w-5 hover:bg-destructive/10 hover:text-destructive"
                    @click="removeEffect(effect.type)"
                  >
                    <IconClose class="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              <!-- Inline Intensity Slider -->
              <div class="space-y-0.5">
                <div class="flex items-center justify-between">
                  <span class="text-[9px] text-muted-foreground">Intensity</span>
                  <span class="text-[9px] font-mono">{{ effect.intensity }}%</span>
                </div>
                <SliderWithTicks 
                  :model-value="[effect.intensity]" 
                  @update:model-value="(val) => val && updateEffectIntensity(effect.type, val[0])"
                  @value-commit="() => applyAllEffects()"
                  :min="0" 
                  :max="100" 
                  :step="1"
                  :showTicks="true"
                />
              </div>

              <!-- Effect Controls -->
              <div v-if="effect.type === 'pixelize'" class="space-y-1.5">
                <div class="flex items-center justify-between">
                  <span class="text-[9px] text-muted-foreground">Block Size</span>
                  <span class="text-[9px] font-mono">{{ (effect as PixelizeEffect).blockSize }}px</span>
                </div>
                <SliderWithTicks 
                  :model-value="[(effect as PixelizeEffect).blockSize]" 
                  @update:model-value="(val) => val && ((effect as PixelizeEffect).blockSize = val[0])"
                  @value-commit="() => applyAllEffects()"
                  :min="2" 
                  :max="50" 
                  :step="1"
                  :showTicks="true"
                />
              </div>

              <div v-if="effect.type === 'radialPixel'" class="space-y-1.5">
                <div class="flex items-center justify-between">
                  <span class="text-[9px] text-muted-foreground">Segments</span>
                  <span class="text-[9px] font-mono">{{ (effect as RadialPixelEffect).segments }}</span>
                </div>
                <SliderWithTicks 
                  :model-value="[(effect as RadialPixelEffect).segments]" 
                  @update:model-value="(val) => val && ((effect as RadialPixelEffect).segments = val[0])"
                  @value-commit="() => applyAllEffects()"
                  :min="4" 
                  :max="64" 
                  :step="1"
                  :showTicks="true"
                />
                <div class="flex items-center justify-between">
                  <span class="text-[9px] text-muted-foreground">Rings</span>
                  <span class="text-[9px] font-mono">{{ (effect as RadialPixelEffect).rings }}</span>
                </div>
                <SliderWithTicks 
                  :model-value="[(effect as RadialPixelEffect).rings]" 
                  @update:model-value="(val) => val && ((effect as RadialPixelEffect).rings = val[0])"
                  @value-commit="() => applyAllEffects()"
                  :min="4" 
                  :max="32" 
                  :step="1"
                  :showTicks="true"
                />
              </div>

              <div v-if="effect.type === 'crossCut'" class="space-y-1.5">
                <div class="flex items-center justify-between">
                  <span class="text-[9px] text-muted-foreground">Slices</span>
                  <span class="text-[9px] font-mono">{{ (effect as CrossCutEffect).slices }}</span>
                </div>
                <SliderWithTicks 
                  :model-value="[(effect as CrossCutEffect).slices]" 
                  @update:model-value="(val) => val && ((effect as CrossCutEffect).slices = val[0])"
                  @value-commit="() => applyAllEffects()"
                  :min="2" 
                  :max="20" 
                  :step="1"
                  :tick-step="2"
                  :integer-labels="true"
                  :showTicks="true"
                />
                <div class="flex items-center justify-between">
                  <span class="text-[9px] text-muted-foreground">Offset</span>
                  <span class="text-[9px] font-mono">{{ (effect as CrossCutEffect).offset }}%</span>
                </div>
                <SliderWithTicks 
                  :model-value="[(effect as CrossCutEffect).offset]" 
                  @update:model-value="(val) => val && ((effect as CrossCutEffect).offset = val[0])"
                  @value-commit="() => applyAllEffects()"
                  :min="0" 
                  :max="100" 
                  :step="1"
                  :showTicks="true"
                />
                <div class="space-y-1">
                  <span class="text-[9px] text-muted-foreground">Direction</span>
                  <Select v-model="(effect as CrossCutEffect).direction" @update:model-value="() => applyAllEffects()">
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
              </div>

              <div v-if="effect.type === 'liquid'" class="space-y-1.5">
                <div class="flex items-center justify-between">
                  <span class="text-[9px] text-muted-foreground">Amplitude</span>
                  <span class="text-[9px] font-mono">{{ (effect as LiquidEffect).amplitude }}</span>
                </div>
                <SliderWithTicks 
                  :model-value="[(effect as LiquidEffect).amplitude]" 
                  @update:model-value="(val) => val && ((effect as LiquidEffect).amplitude = val[0])"
                  @value-commit="() => applyAllEffects()"
                  :min="0" 
                  :max="100" 
                  :step="1"
                  :showTicks="true"
                />
                <div class="flex items-center justify-between">
                  <span class="text-[9px] text-muted-foreground">Frequency</span>
                  <span class="text-[9px] font-mono">{{ (effect as LiquidEffect).frequency }}</span>
                </div>
                <SliderWithTicks 
                  :model-value="[(effect as LiquidEffect).frequency]" 
                  @update:model-value="(val) => val && ((effect as LiquidEffect).frequency = val[0])"
                  @value-commit="() => applyAllEffects()"
                  :min="1" 
                  :max="20" 
                  :step="1"
                  :integer-labels="true"
                  :showTicks="true"
                />
              </div>

              <div v-if="effect.type === 'posterize'" class="space-y-1.5">
                <div class="flex items-center justify-between">
                  <span class="text-[9px] text-muted-foreground">Color Levels</span>
                  <span class="text-[9px] font-mono">{{ (effect as PosterizeEffect).levels }}</span>
                </div>
                <SliderWithTicks 
                  :model-value="[(effect as PosterizeEffect).levels]" 
                  @update:model-value="(val) => val && ((effect as PosterizeEffect).levels = val[0])"
                  @value-commit="() => applyAllEffects()"
                  :min="2" 
                  :max="16" 
                  :step="1"
                  :showTicks="true"
                />
              </div>

              <div v-if="effect.type === 'tvGlitch'" class="space-y-1.5">
                <div class="flex items-center justify-between">
                  <span class="text-[9px] text-muted-foreground">Distortion</span>
                  <span class="text-[9px] font-mono">{{ (effect as TvGlitchEffect).distortion }}%</span>
                </div>
                <SliderWithTicks 
                  :model-value="[(effect as TvGlitchEffect).distortion]" 
                  @update:model-value="(val) => val && ((effect as TvGlitchEffect).distortion = val[0])"
                  @value-commit="() => applyAllEffects()"
                  :min="0" 
                  :max="100" 
                  :step="1"
                  :showTicks="true"
                />
                <div class="flex items-center justify-between">
                  <span class="text-[9px] text-muted-foreground">Color Shift</span>
                  <span class="text-[9px] font-mono">{{ (effect as TvGlitchEffect).colorShift }}px</span>
                </div>
                <SliderWithTicks 
                  :model-value="[(effect as TvGlitchEffect).colorShift]" 
                  @update:model-value="(val) => val && ((effect as TvGlitchEffect).colorShift = val[0])"
                  @value-commit="() => applyAllEffects()"
                  :min="0" 
                  :max="50" 
                  :step="1"
                  :tick-step="5"
                  :integer-labels="true"
                  :showTicks="true"
                />
                <div class="flex items-center justify-between">
                  <span class="text-[9px] text-muted-foreground">Noise</span>
                  <span class="text-[9px] font-mono">{{ (effect as TvGlitchEffect).noise }}%</span>
                </div>
                <SliderWithTicks 
                  :model-value="[(effect as TvGlitchEffect).noise]" 
                  @update:model-value="(val) => val && ((effect as TvGlitchEffect).noise = val[0])"
                  @value-commit="() => applyAllEffects()"
                  :min="0" 
                  :max="100" 
                  :step="1"
                  :showTicks="true"
                />
                <div class="flex items-center gap-2">
                  <Checkbox 
                    :id="`scanlines-${effect.type}`"
                    v-model:checked="(effect as TvGlitchEffect).scanlines"
                    @update:checked="() => applyAllEffects()"
                  />
                  <Label :for="`scanlines-${effect.type}`" class="text-[9px] text-muted-foreground cursor-pointer">Scanlines</Label>
                </div>
              </div>

              <div v-if="effect.type === 'dotPattern'" class="space-y-1.5">
                <div class="flex items-center justify-between">
                  <span class="text-[9px] text-muted-foreground">Dot Size</span>
                  <span class="text-[9px] font-mono">{{ (effect as DotPatternEffect).dotSize }}px</span>
                </div>
                <SliderWithTicks 
                  :model-value="[(effect as DotPatternEffect).dotSize]" 
                  @update:model-value="(val) => val && ((effect as DotPatternEffect).dotSize = val[0])"
                  @value-commit="() => applyAllEffects()"
                  :min="1" 
                  :max="20" 
                  :step="1"
                  :integer-labels="true"
                  :showTicks="true"
                />
                <div class="flex items-center justify-between">
                  <span class="text-[9px] text-muted-foreground">Spacing</span>
                  <span class="text-[9px] font-mono">{{ (effect as DotPatternEffect).spacing }}px</span>
                </div>
                <SliderWithTicks 
                  :model-value="[(effect as DotPatternEffect).spacing]" 
                  @update:model-value="(val) => val && ((effect as DotPatternEffect).spacing = val[0])"
                  @value-commit="() => applyAllEffects()"
                  :min="1" 
                  :max="20" 
                  :step="1"
                  :integer-labels="true"
                  :showTicks="true"
                />
                <div class="space-y-1">
                  <span class="text-[9px] text-muted-foreground">Shape</span>
                  <Select v-model="(effect as DotPatternEffect).shape" @update:model-value="() => applyAllEffects()">
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
              </div>

              <div v-if="effect.type === 'halftone'" class="space-y-1.5">
                <div class="flex items-center justify-between">
                  <span class="text-[9px] text-muted-foreground">Dot Size</span>
                  <span class="text-[9px] font-mono">{{ (effect as HalftoneEffect).dotSize }}px</span>
                </div>
                <SliderWithTicks 
                  :model-value="[(effect as HalftoneEffect).dotSize]" 
                  @update:model-value="(val) => val && ((effect as HalftoneEffect).dotSize = val[0])"
                  @value-commit="() => applyAllEffects()"
                  :min="1" 
                  :max="20" 
                  :step="1"
                  :showTicks="true"
                />
                <div class="flex items-center justify-between">
                  <span class="text-[9px] text-muted-foreground">Angle</span>
                  <span class="text-[9px] font-mono">{{ (effect as HalftoneEffect).angle }}°</span>
                </div>
                <SliderWithTicks 
                  :model-value="[(effect as HalftoneEffect).angle]" 
                  @update:model-value="(val) => val && ((effect as HalftoneEffect).angle = val[0])"
                  @value-commit="() => applyAllEffects()"
                  :min="0" 
                  :max="180" 
                  :step="1"
                  :showTicks="true"
                />
                <div class="space-y-1">
                  <span class="text-[9px] text-muted-foreground">Shape</span>
                  <Select v-model="(effect as HalftoneEffect).shape" @update:model-value="() => applyAllEffects()">
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
              </div>

              <div v-if="effect.type === 'mirror'" class="space-y-2">
                <div class="space-y-1">
                  <span class="text-[9px] text-muted-foreground">Axis</span>
                  <Select v-model="(effect as MirrorEffect).axis" @update:model-value="() => applyAllEffects()">
                    <SelectTrigger class="h-7 text-[11px] border border-input hover:bg-accent">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="horizontal" class="text-xs py-1">Horizontal</SelectItem>
                      <SelectItem value="vertical" class="text-xs py-1">Vertical</SelectItem>
                      <SelectItem value="both" class="text-xs py-1">Both</SelectItem>
                      <SelectItem value="quad" class="text-xs py-1">Quad</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div v-if="effect.type === 'vignette'" class="space-y-1.5">
                <div class="flex items-center justify-between">
                  <span class="text-[9px] text-muted-foreground">Size</span>
                  <span class="text-[9px] font-mono">{{ (effect as VignetteEffect).size }}%</span>
                </div>
                <SliderWithTicks 
                  :model-value="[(effect as VignetteEffect).size]" 
                  @update:model-value="(val) => val && ((effect as VignetteEffect).size = val[0])"
                  @value-commit="() => applyAllEffects()"
                  :min="0" 
                  :max="100" 
                  :step="1"
                  :showTicks="true"
                />
                <div class="flex items-center justify-between">
                  <span class="text-[9px] text-muted-foreground">Softness</span>
                  <span class="text-[9px] font-mono">{{ (effect as VignetteEffect).softness }}%</span>
                </div>
                <SliderWithTicks 
                  :model-value="[(effect as VignetteEffect).softness]" 
                  @update:model-value="(val) => val && ((effect as VignetteEffect).softness = val[0])"
                  @value-commit="() => applyAllEffects()"
                  :min="0" 
                  :max="100" 
                  :step="1"
                  :showTicks="true"
                />
              </div>

              <div v-if="effect.type === 'duotone'" class="grid grid-cols-2 gap-2">
                <div class="space-y-1 min-w-0">
                  <span class="text-[9px] text-muted-foreground">Shadow Color</span>
                  <Popover>
                    <PopoverTrigger as-child>
                      <Button variant="outline" class="w-full h-7 px-2 justify-start transition-all hover:bg-accent hover:text-accent-foreground">
                        <div class="flex items-center gap-2">
                          <div
                            class="w-4 h-4 rounded border border-border"
                            :style="{ backgroundColor: (effect as DuotoneEffect).shadowColor }"
                          ></div>
                          <span class="text-xs font-mono">{{ (effect as DuotoneEffect).shadowColor }}</span>
                        </div>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent class="w-[256px]" align="end">
                      <ColorPicker 
                        :modelValue="(effect as DuotoneEffect).shadowColor"
                        @update:modelValue="(val) => { (effect as DuotoneEffect).shadowColor = val; applyAllEffects() }"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div class="space-y-1 min-w-0">
                  <span class="text-[9px] text-muted-foreground">Highlight Color</span>
                  <Popover>
                    <PopoverTrigger as-child>
                      <Button variant="outline" class="w-full h-7 px-2 justify-start transition-all hover:bg-accent hover:text-accent-foreground">
                        <div class="flex items-center gap-2">
                          <div
                            class="w-4 h-4 rounded border border-border"
                            :style="{ backgroundColor: (effect as DuotoneEffect).highlightColor }"
                          ></div>
                          <span class="text-xs font-mono">{{ (effect as DuotoneEffect).highlightColor }}</span>
                        </div>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent class="w-[256px]" align="end">
                      <ColorPicker 
                        :modelValue="(effect as DuotoneEffect).highlightColor"
                        @update:modelValue="(val) => { (effect as DuotoneEffect).highlightColor = val; applyAllEffects() }"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div v-if="effect.type === 'rgbShift'" class="space-y-1.5">
                <div class="flex items-center justify-between">
                  <span class="text-[9px] text-muted-foreground">Amount</span>
                  <span class="text-[9px] font-mono">{{ (effect as RgbShiftEffect).amount }}px</span>
                </div>
                <SliderWithTicks 
                  :model-value="[(effect as RgbShiftEffect).amount]" 
                  @update:model-value="(val) => val && ((effect as RgbShiftEffect).amount = val[0])"
                  @value-commit="() => applyAllEffects()"
                  :min="0" 
                  :max="50" 
                  :step="1"
                  :tick-step="5"
                  :integer-labels="true"
                  :showTicks="true"
                />
                <div class="flex items-center justify-between">
                  <span class="text-[9px] text-muted-foreground">Angle</span>
                  <span class="text-[9px] font-mono">{{ (effect as RgbShiftEffect).angle }}°</span>
                </div>
                <SliderWithTicks 
                  :model-value="[(effect as RgbShiftEffect).angle]" 
                  @update:model-value="(val) => val && ((effect as RgbShiftEffect).angle = val[0])"
                  @value-commit="() => applyAllEffects()"
                  :min="0" 
                  :max="360" 
                  :step="1"
                  :showTicks="true"
                />
              </div>

              <div v-if="effect.type === 'motionBlur'" class="space-y-1.5">
                <div class="flex items-center justify-between">
                  <span class="text-[9px] text-muted-foreground">Distance</span>
                  <span class="text-[9px] font-mono">{{ (effect as MotionBlurEffect).distance }}px</span>
                </div>
                <SliderWithTicks 
                  :model-value="[(effect as MotionBlurEffect).distance]" 
                  @update:model-value="(val) => val && ((effect as MotionBlurEffect).distance = val[0])"
                  @value-commit="() => applyAllEffects()"
                  :min="1" 
                  :max="40" 
                  :step="1"
                  :showTicks="true"
                />
                <div class="flex items-center justify-between">
                  <span class="text-[9px] text-muted-foreground">Angle</span>
                  <span class="text-[9px] font-mono">{{ (effect as MotionBlurEffect).angle }}°</span>
                </div>
                <SliderWithTicks 
                  :model-value="[(effect as MotionBlurEffect).angle]" 
                  @update:model-value="(val) => val && ((effect as MotionBlurEffect).angle = val[0])"
                  @value-commit="() => applyAllEffects()"
                  :min="0" 
                  :max="360" 
                  :step="1"
                  :showTicks="true"
                />
              </div>

              <div v-if="effect.type === 'scanlines'" class="space-y-1.5">
                <div class="flex items-center justify-between">
                  <span class="text-[9px] text-muted-foreground">Density</span>
                  <span class="text-[9px] font-mono">{{ (effect as ScanlinesEffect).density }}</span>
                </div>
                <SliderWithTicks 
                  :model-value="[(effect as ScanlinesEffect).density]" 
                  @update:model-value="(val) => val && ((effect as ScanlinesEffect).density = val[0])"
                  @value-commit="() => applyAllEffects()"
                  :min="1" 
                  :max="10" 
                  :step="1"
                  :showTicks="true"
                />
                <div class="flex items-center justify-between">
                  <span class="text-[9px] text-muted-foreground">Opacity</span>
                  <span class="text-[9px] font-mono">{{ (effect as ScanlinesEffect).opacity }}%</span>
                </div>
                <SliderWithTicks 
                  :model-value="[(effect as ScanlinesEffect).opacity]" 
                  @update:model-value="(val) => val && ((effect as ScanlinesEffect).opacity = val[0])"
                  @value-commit="() => applyAllEffects()"
                  :min="0" 
                  :max="100" 
                  :step="1"
                  :showTicks="true"
                />
              </div>

              <div v-if="effect.type === 'outliner'" class="space-y-1.5">
                <div class="flex items-center justify-between">
                  <span class="text-[9px] text-muted-foreground">Thickness</span>
                  <span class="text-[9px] font-mono">{{ (effect as OutlinerEffect).thickness }}px</span>
                </div>
                <SliderWithTicks 
                  :model-value="[(effect as OutlinerEffect).thickness]" 
                  @update:model-value="(val) => val && ((effect as OutlinerEffect).thickness = val[0])"
                  @value-commit="() => applyAllEffects()"
                  :min="1" 
                  :max="10" 
                  :step="1"
                  :showTicks="true"
                />
                <div class="flex items-center justify-between">
                  <span class="text-[9px] text-muted-foreground">Threshold</span>
                  <span class="text-[9px] font-mono">{{ (effect as OutlinerEffect).threshold }}</span>
                </div>
                <SliderWithTicks 
                  :model-value="[(effect as OutlinerEffect).threshold]" 
                  @update:model-value="(val) => val && ((effect as OutlinerEffect).threshold = val[0])"
                  @value-commit="() => applyAllEffects()"
                  :min="0" 
                  :max="255" 
                  :step="1"
                  :showTicks="true"
                />
                <div class="flex items-center gap-2">
                  <Checkbox 
                    id="invert-outliner"
                    v-model:checked="(effect as OutlinerEffect).invert"
                    @update:checked="() => applyAllEffects()"
                  />
                  <Label for="invert-outliner" class="text-[9px] text-muted-foreground cursor-pointer">Invert Colors</Label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Auto-Apply Notice & Manual Apply Button -->
        <div v-if="activeEffects.length > 0" class="space-y-1.5">
          <div class="flex items-center gap-1.5 text-[9px] text-muted-foreground px-1">
            <IconHelpcenter class="w-3 h-3" />
            <span>Effects apply automatically as you adjust</span>
          </div>
          <Button 
            class="w-full h-7 text-xs"
            variant="outline"
            :disabled="isProcessing"
            @click="applyAllEffects"
          >
            <IconRefresh v-if="isProcessing" class="w-3 h-3 mr-1.5 animate-spin" />
            <template v-else>Re-apply All Effects</template>
          </Button>
        </div>
      </TabsContent>

      <!-- ADJUST TAB - Color Adjustments -->
      <TabsContent value="adjust" class="mt-2 space-y-3">
        <!-- Grayscale Mode -->
        <div class="space-y-1.5">
          <Label class="text-[10px] font-bold uppercase tracking-wide">Grayscale</Label>
          <div class="grid grid-cols-3 gap-1">
            <Button
              v-for="mode in ['average', 'luminosity', 'lightness']"
              :key="mode"
              variant="outline"
              size="sm"
              :class="['h-6 text-[10px] transition-all capitalize', elementGrayscale === mode ? 'bg-primary text-primary-foreground border-primary' : '']"
              @click="changeGrayscaleMode(mode)"
            >
              {{ mode === 'lightness' ? 'Bright' : mode }}
            </Button>
          </div>
        </div>

        <Separator class="my-1" />

        <!-- Quick Modes -->
        <div class="space-y-1.5">
          <Label class="text-[10px] font-bold uppercase tracking-wide">Mode</Label>
          <div class="grid grid-cols-3 gap-1">
            <Button
              v-for="filter in ['Invert', 'Sharpen', 'Emboss']"
              :key="filter"
              variant="outline"
              size="sm"
              :class="['h-6 text-[10px] transition-all', elementFilters.includes(filter) ? 'bg-primary text-primary-foreground border-primary' : '']"
              @click="toggleFilter(filter)"
            >
              {{ filter }}
            </Button>
          </div>
        </div>

        <Separator class="my-1" />

        <!-- Adjustment Sliders -->
        <div class="space-y-2">
          <Label class="text-[10px] font-bold uppercase tracking-wide">Adjustments</Label>
          
          <div class="space-y-1.5">
            <div class="flex items-center justify-between">
              <span class="text-[10px] text-muted-foreground">Brightness</span>
              <span class="text-[10px] font-mono">{{ brightness.toFixed(2) }}</span>
            </div>
            <SliderWithTicks :model-value="[brightness]" @update:model-value="(val) => val && (brightness = val[0])" @value-commit="() => changeColorMode('Brightness', brightness)" :min="-1" :max="1" :step="0.01" />
          </div>

          <div class="space-y-1.5">
            <div class="flex items-center justify-between">
              <span class="text-[10px] text-muted-foreground">Contrast</span>
              <span class="text-[10px] font-mono">{{ contrast.toFixed(2) }}</span>
            </div>
            <SliderWithTicks :model-value="[contrast]" @update:model-value="(val) => val && (contrast = val[0])" @value-commit="() => changeColorMode('Contrast', contrast)" :min="-1" :max="1" :step="0.01" />
          </div>

          <div class="space-y-1.5">
            <div class="flex items-center justify-between">
              <span class="text-[10px] text-muted-foreground">Saturation</span>
              <span class="text-[10px] font-mono">{{ saturation.toFixed(2) }}</span>
            </div>
            <SliderWithTicks :model-value="[saturation]" @update:model-value="(val) => val && (saturation = val[0])" @value-commit="() => changeColorMode('Saturation', saturation)" :min="-1" :max="1" :step="0.01" />
          </div>

          <div class="space-y-1.5">
            <div class="flex items-center justify-between">
              <span class="text-[10px] text-muted-foreground">Vibrance</span>
              <span class="text-[10px] font-mono">{{ vibrance.toFixed(2) }}</span>
            </div>
            <SliderWithTicks :model-value="[vibrance]" @update:model-value="(val) => val && (vibrance = val[0])" @value-commit="() => changeColorMode('Vibrance', vibrance)" :min="-1" :max="1" :step="0.01" />
          </div>

          <div class="space-y-1.5">
            <div class="flex items-center justify-between">
              <span class="text-[10px] text-muted-foreground">Hue</span>
              <span class="text-[10px] font-mono">{{ hue.toFixed(2) }}</span>
            </div>
            <SliderWithTicks :model-value="[hue]" @update:model-value="(val) => val && (hue = val[0])" @value-commit="() => changeColorMode('Hue', hue)" :min="-2" :max="2" :step="0.002" />
          </div>

          <div class="space-y-1.5">
            <div class="flex items-center justify-between">
              <span class="text-[10px] text-muted-foreground">Noise</span>
              <span class="text-[10px] font-mono">{{ noise }}</span>
            </div>
            <SliderWithTicks :model-value="[noise]" @update:model-value="(val) => val && (noise = val[0])" @value-commit="() => changeColorMode('Noise', noise)" :min="0" :max="1000" :step="100" />
          </div>

          <div class="space-y-1.5">
            <div class="flex items-center justify-between">
              <span class="text-[10px] text-muted-foreground">Pixelate</span>
              <span class="text-[10px] font-mono">{{ pixelate }}</span>
            </div>
            <SliderWithTicks :model-value="[pixelate]" @update:model-value="(val) => val && (pixelate = val[0])" @value-commit="() => changeColorMode('Pixelate', pixelate)" :min="0" :max="20" :step="1" />
          </div>

          <div class="space-y-1.5">
            <div class="flex items-center justify-between">
              <span class="text-[10px] text-muted-foreground">Blur</span>
              <span class="text-[10px] font-mono">{{ blur.toFixed(2) }}</span>
            </div>
            <SliderWithTicks :model-value="[blur]" @update:model-value="(val) => val && (blur = val[0])" @value-commit="() => changeColorMode('Blur', blur)" :min="0" :max="1" :step="0.01" />
          </div>
        </div>
      </TabsContent>
    </Tabs>

  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useMainStore, useTemplatesStore } from '@/store'
import { filters, Image } from 'fabric'
import { ElementNames } from '@/types/elements'
import { SharpenMatrix, EmbossMatrix, GrayscaleType } from '@/configs/images'
import { propertiesToInclude } from '@/configs/canvas'
import useCanvas from '@/views/Canvas/useCanvas'
import useHistorySnapshot from '@/hooks/useHistorySnapshot'
import { SnapshotType } from '@/types/history'

import { 
  IMAGE_EFFECTS, 
  getEffectsByCategory, 
  getEffectByType,
  type ImageEffectConfig 
} from '@/configs/imageEffects'
import { ImageEffectsProcessor } from '@/extension/effects/imageEffectsProcessor'
import type { 
  ImageEffect, 
  ImageEffectType,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Filter, Sparkles, SlidersHorizontal } from 'lucide-vue-next'

const props = withDefaults(defineProps<{
  mode?: 'compact' | 'panel'
  section?: 'filters' | 'effects' | 'adjust'
}>(), {
  mode: 'compact',
  section: 'filters',
})

const emit = defineEmits<{
  (event: 'open', section: 'filters' | 'effects' | 'adjust'): void
}>()

const activeSection = ref(props.section)

watch(() => props.section, (value) => {
  activeSection.value = value
})

const [canvas] = useCanvas()
const { canvasObject } = storeToRefs(useMainStore())
const templatesStore = useTemplatesStore()
const { templateId } = storeToRefs(templatesStore)
const { addHistorySnapshot } = useHistorySnapshot()

interface ImageWithEffectsState extends Image {
  originSrc?: string
  imageEffects?: ImageEffect[]
  imageEffectsOriginalSrc?: string
}

const handleElement = computed(() => canvasObject.value as ImageWithEffectsState)
const imageEffectsProcessor = new ImageEffectsProcessor()

// ==================== COLOR PRESETS (FILTERS) ====================
interface ColorPreset {
  id: string
  name: string
  filters: string[]
  preview: string
}

const colorPresets: ColorPreset[] = [
  { 
    id: 'none', 
    name: 'Original', 
    filters: [],
    preview: './img/previews/filters/nature.jpg'
  },
  { 
    id: 'vintage', 
    name: 'Vintage', 
    filters: ['Vintage'],
    preview: './img/previews/filters/vintage.png'
  },
  { 
    id: 'sepia', 
    name: 'Sepia', 
    filters: ['Sepia'],
    preview: './img/previews/filters/sepia.png'
  },
  { 
    id: 'cool', 
    name: 'Cool', 
    filters: ['Kodachrome'],
    preview: './img/previews/filters/cool.png'
  },
  { 
    id: 'warm', 
    name: 'Warm', 
    filters: ['Brownie'],
    preview: './img/previews/filters/warm.png'
  },
  { 
    id: 'vivid', 
    name: 'Vivid', 
    filters: ['Technicolor'],
    preview: './img/previews/filters/vivid.png'
  },
  { 
    id: 'polaroid', 
    name: 'Polaroid', 
    filters: ['Polaroid'],
    preview: './img/previews/filters/polaroid.png'
  },
  { 
    id: 'noir', 
    name: 'Noir', 
    filters: ['BlackWhite'],
    preview: './img/previews/filters/noir.png'
  },
  { 
    id: 'mellow', 
    name: 'Mellow', 
    filters: ['Vintage', 'Polaroid'],
    preview: './img/previews/filters/mellow.png'
  },
]

const activePreset = ref<string>('none')
const presetFilterTypes = ['Vintage', 'Sepia', 'Kodachrome', 'Brownie', 'Technicolor', 'Polaroid', 'BlackWhite']

const applyColorPreset = (presetId: string) => {
  if (!handleElement.value) return
  
  const preset = colorPresets.find(p => p.id === presetId)
  if (!preset) return
  
  activePreset.value = presetId
  
  // Remove existing preset filters
  handleElement.value.filters = handleElement.value.filters.filter(
    f => !presetFilterTypes.includes(f.type)
  )

  if (preset.filters.length === 0) {
    handleElement.value.applyFilters()
    canvas.renderAll()
    return
  }
  
  // Apply new preset filters
  preset.filters.forEach(filterName => {
    if (filterName === 'Vintage') {
      // @ts-ignore
      handleElement.value.filters.push(new filters.Vintage())
    } else if (filterName === 'Sepia') {
      // @ts-ignore
      handleElement.value.filters.push(new filters.Sepia())
    } else if (filterName === 'Kodachrome') {
      // @ts-ignore
      handleElement.value.filters.push(new filters.Kodachrome())
    } else if (filterName === 'Brownie') {
      // @ts-ignore
      handleElement.value.filters.push(new filters.Brownie())
    } else if (filterName === 'Technicolor') {
      // @ts-ignore
      handleElement.value.filters.push(new filters.Technicolor())
    } else if (filterName === 'Polaroid') {
      // @ts-ignore
      handleElement.value.filters.push(new filters.Polaroid())
    } else if (filterName === 'BlackWhite') {
      // @ts-ignore
      handleElement.value.filters.push(new filters.BlackWhite())
    }
  })
  
  handleElement.value.applyFilters()
  canvas.renderAll()
}

const clearColorPreset = () => {
  if (!handleElement.value) return
  
  activePreset.value = 'none'
  
  handleElement.value.filters = handleElement.value.filters.filter(
    f => !presetFilterTypes.includes(f.type)
  )
  
  handleElement.value.applyFilters()
  canvas.renderAll()
}

// ==================== ADJUSTMENTS (FROM ElementFilter) ====================
const imageFilters = computed(() => {
  const filterList: string[] = []
  if (!handleElement.value || !handleElement.value.filters) return filterList
  
  handleElement.value.filters.forEach((item) => {
    if (item.type === 'Convolute') {
      const itemMatrix = (item as filters.Convolute).matrix
      if (itemMatrix.length === SharpenMatrix.length && itemMatrix.every((v, i) => v === SharpenMatrix[i])) {
        filterList.push('Sharpen')
      }
      if (itemMatrix.length === EmbossMatrix.length && itemMatrix.every((v, i) => v === EmbossMatrix[i])) {
        filterList.push('Emboss')
      }
    } else {
      if (!filterList.includes(item.type)) filterList.push(item.type)
    }
  })
  return filterList
})

const imageGrayscale = computed(() => {
  let grayscale = ''
  if (!handleElement.value || !handleElement.value.filters) return grayscale
  
  handleElement.value.filters.forEach((item) => {
    if (item.type === GrayscaleType) {
      grayscale = (item as filters.Grayscale).mode
    }
  })
  return grayscale
})

const elementGrayscale = ref<string>(imageGrayscale.value)
const elementFilters = ref<string[]>(imageFilters.value)

const brightness = ref(0)
const contrast = ref(0)
const saturation = ref(0)
const vibrance = ref(0)
const hue = ref(0)
const noise = ref(0)
const pixelate = ref(0)
const blur = ref(0)

const changeGrayscaleMode = (mode: string) => {
  if (!handleElement.value) return
  if (!handleElement.value.filters) handleElement.value.filters = []
  
  mode === elementGrayscale.value
    ? (elementGrayscale.value = '')
    : (elementGrayscale.value = mode)
    
  if (elementGrayscale.value) {
    handleElement.value.filters.push(
      new filters.Grayscale({ mode: elementGrayscale.value as any }) as any
    )
    elementFilters.value.push(GrayscaleType)
  } else {
    handleElement.value.filters = handleElement.value.filters.filter(
      (obj) => obj.type !== GrayscaleType
    )
    elementFilters.value = elementFilters.value.filter((obj) => obj !== GrayscaleType)
  }
  
  handleElement.value.applyFilters()
  canvas.renderAll()
}

const toggleFilter = (filterName: string) => {
  if (!handleElement.value) return
  if (elementFilters.value.includes(filterName)) {
    elementFilters.value = elementFilters.value.filter(f => f !== filterName)
  } else {
    elementFilters.value.push(filterName)
  }
  changeFilters()
}

const changeFilters = () => {
  if (!handleElement.value) return
  
  elementFilters.value.forEach((item) => {
    const itemFilter = handleElement.value.filters.filter((obj) => obj.type === item)[0]
    if (!itemFilter) {
      if (item === 'Invert') {
        handleElement.value.filters.push(new filters.Invert() as any)
      }
    }
  })
  
  handleElement.value.filters = handleElement.value.filters.filter((obj) =>
    elementFilters.value.includes(obj.type)
  )

  if (elementFilters.value.includes('Sharpen')) {
    handleElement.value.filters.push(new filters.Convolute({ matrix: SharpenMatrix }) as any)
  }
  if (elementFilters.value.includes('Emboss')) {
    handleElement.value.filters.push(new filters.Convolute({ matrix: EmbossMatrix }) as any)
  }
  
  handleElement.value.applyFilters()
  canvas.renderAll()
}

const changeColorMode = (type: string, value: number) => {
  if (!handleElement.value) return
  
  if (type === 'Brightness') {
    const brightnessFilter = new filters.Brightness({ brightness: value })
    handleElement.value.filters = handleElement.value.filters.filter((obj) => obj.type !== type)
    handleElement.value.filters.push(brightnessFilter as any)
  } else if (type === 'Contrast') {
    const contrastFilter = new filters.Contrast({ contrast: value })
    handleElement.value.filters = handleElement.value.filters.filter((obj) => obj.type !== type)
    handleElement.value.filters.push(contrastFilter as any)
  } else if (type === 'Saturation') {
    const saturationFilter = new filters.Saturation({ saturation: value })
    handleElement.value.filters = handleElement.value.filters.filter((obj) => obj.type !== type)
    handleElement.value.filters.push(saturationFilter as any)
  } else if (type === 'Vibrance') {
    const vibranceFilter = new filters.Vibrance({ vibrance: value })
    handleElement.value.filters = handleElement.value.filters.filter((obj) => obj.type !== type)
    handleElement.value.filters.push(vibranceFilter as any)
  } else if (type === 'Hue') {
    const hueFilter = new filters.HueRotation({ rotation: value })
    handleElement.value.filters = handleElement.value.filters.filter((obj) => obj.type !== type)
    handleElement.value.filters.push(hueFilter as any)
  } else if (type === 'Noise') {
    const noiseFilter = new filters.Noise({ noise: value })
    handleElement.value.filters = handleElement.value.filters.filter((obj) => obj.type !== type)
    handleElement.value.filters.push(noiseFilter as any)
  } else if (type === 'Pixelate') {
    const pixelateFilter = new filters.Pixelate({ blocksize: value })
    handleElement.value.filters = handleElement.value.filters.filter((obj) => obj.type !== type)
    handleElement.value.filters.push(pixelateFilter as any)
  } else if (type === 'Blur') {
    const blurFilter = new filters.Blur({ blur: value })
    handleElement.value.filters = handleElement.value.filters.filter((obj) => obj.type !== type)
    handleElement.value.filters.push(blurFilter as any)
  }
  
  handleElement.value.applyFilters()
  canvas.renderAll()
}

// ==================== IMAGE EFFECTS ====================
// All effects combined
const allEffects = computed(() => [
  ...getEffectsByCategory('stylize'),
  ...getEffectsByCategory('distortion'),
  ...getEffectsByCategory('pattern'),
  ...getEffectsByCategory('color')
])

const activeEffects = ref<ImageEffect[]>([])
const isProcessing = ref(false)
const originalImageSrc = ref<string | null>(null)
const supportedEffectTypes = new Set(IMAGE_EFFECTS.map((effect) => effect.type))

const cloneImageEffects = (effects: ImageEffect[] = []) => {
  return JSON.parse(JSON.stringify(effects)) as ImageEffect[]
}

const normalizeEffects = (effects: ImageEffect[] = []) => {
  return effects.filter((effect) => supportedEffectTypes.has(effect.type))
}

const syncEffectsStateFromElement = (element?: ImageWithEffectsState) => {
  if (!element) {
    activeEffects.value = []
    originalImageSrc.value = null
    return
  }

  const savedEffects = Array.isArray(element.imageEffects)
    ? normalizeEffects(cloneImageEffects(element.imageEffects))
    : []

  activeEffects.value = savedEffects
  originalImageSrc.value = element.imageEffectsOriginalSrc || element.originSrc || null
}

const persistEffectsState = (element: ImageWithEffectsState) => {
  const clonedEffects = cloneImageEffects(activeEffects.value)
  const baseSrc = originalImageSrc.value || undefined

  element.set({
    imageEffects: clonedEffects,
    imageEffectsOriginalSrc: baseSrc,
    originSrc: baseSrc,
  } as any)

  templatesStore.updateElement({
    id: element.id,
    props: element.toObject(propertiesToInclude as any[]) as any,
  })
}

const addEffectHistorySnapshot = (element: ImageWithEffectsState, previousState: any) => {
  const index = canvas._objects.findIndex(item => item.id === element.id)
  if (index === -1) return

  addHistorySnapshot({
    type: SnapshotType.MODIFY,
    index,
    target: element.toObject(propertiesToInclude as any[]),
    transform: {
      original: {
        src: previousState?.src,
        originSrc: previousState?.originSrc,
        imageEffects: previousState?.imageEffects,
        imageEffectsOriginalSrc: previousState?.imageEffectsOriginalSrc,
      },
    } as any,
    tid: templateId.value,
  } as any)
}

const isEffectActive = (type: ImageEffectType) => {
  return activeEffects.value.some(e => e.type === type)
}

const getEffectName = (type: ImageEffectType) => {
  const config = getEffectByType(type)
  return config?.name || type
}

const toggleEffect = (effectConfig: ImageEffectConfig) => {
  const existingIndex = activeEffects.value.findIndex(e => e.type === effectConfig.type)
  
  if (existingIndex >= 0) {
    activeEffects.value.splice(existingIndex, 1)
    applyAllEffects()
  } else {
    const newEffect = {
      ...effectConfig.defaultSettings,
      type: effectConfig.type,
      enabled: true
    } as ImageEffect
    activeEffects.value.push(newEffect)
    applyAllEffects()
  }
}

const removeEffect = (type: ImageEffectType) => {
  const index = activeEffects.value.findIndex(e => e.type === type)
  if (index >= 0) {
    activeEffects.value.splice(index, 1)
    applyAllEffects()
  }
}

const updateEffectIntensity = (type: ImageEffectType, intensity: number) => {
  const effect = activeEffects.value.find(e => e.type === type)
  if (effect) {
    effect.intensity = intensity
  }
}

const clearAllEffects = async () => {
  const element = handleElement.value
  if (!element) return

  activeEffects.value = []

  const previousState = element.toObject(propertiesToInclude as any[])

  if (originalImageSrc.value) {
    await element.setSrc(originalImageSrc.value)
  }

  originalImageSrc.value = null
  persistEffectsState(element)
  canvas.renderAll()
  addEffectHistorySnapshot(element, previousState)
}

const applyAllEffects = async () => {
  const element = handleElement.value
  if (!element) return

  const previousState = element.toObject(propertiesToInclude as any[])
  
  // If no active effects, restore original image
  if (activeEffects.value.length === 0) {
    if (originalImageSrc.value) {
      await element.setSrc(originalImageSrc.value)
    }
    originalImageSrc.value = null
    persistEffectsState(element)
    canvas.renderAll()
    addEffectHistorySnapshot(element, previousState)
    return
  }
  
  isProcessing.value = true
  
  try {
    if (!originalImageSrc.value) {
      originalImageSrc.value = element.imageEffectsOriginalSrc || element.originSrc || element.getSrc()
    }
    
    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = originalImageSrc.value!
    })
    
    const resultImageData = await imageEffectsProcessor.applyEffects(img, activeEffects.value)
    const dataUrl = imageEffectsProcessor.toDataURL(resultImageData)
    
    await element.setSrc(dataUrl)
    persistEffectsState(element)
    canvas.renderAll()
    addEffectHistorySnapshot(element, previousState)
    
  } catch (error) {
    console.error('Error applying effects:', error)
  } finally {
    isProcessing.value = false
  }
}

watch(
  () => canvasObject.value,
  (element) => {
    const activeImage = element as ImageWithEffectsState | undefined
    if (!activeImage || activeImage.type?.toLowerCase() !== ElementNames.IMAGE) {
      activeEffects.value = []
      originalImageSrc.value = null
      return
    }
    syncEffectsStateFromElement(activeImage)
  },
  { immediate: true }
)

// ==================== TOTAL COUNT ====================
const totalActiveCount = computed(() => {
  let count = activeEffects.value.length
  if (activePreset.value) count++
  count += elementFilters.value.filter(f => !['Vintage', 'Sepia', 'Kodachrome', 'Brownie', 'Technicolor', 'Polaroid', 'BlackWhite'].includes(f)).length
  return count
})
</script>

<style scoped>
.active-effects-controls .flex.items-center.justify-between > span {
  display: inline-flex;
  align-items: center;
  line-height: 1;
}
</style>

