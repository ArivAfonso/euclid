<template>
  <div class="space-y-2 border border-border/50 rounded-md p-2.5 bg-muted/20">
    <div class="flex items-center justify-between mb-1">
      <h3 class="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide select-none">
        <div class="w-1.5 h-1.5 bg-red-600 rounded-sm"></div>
        Filter
      </h3>
      <Badge variant="outline" class="text-[10px] px-1.5 py-0 select-none">{{ elementFilters.length }} Active</Badge>
    </div>
      <!-- Grayscale Mode -->
      <div class="space-y-1.5">
        <Label class="text-[10px] font-bold uppercase tracking-wide flex items-center gap-1">
          <Blend class="h-2.5 w-2.5" />
          Grayscale</Label>
        <div class="grid grid-cols-3 gap-1">
          <Button
            variant="outline"
            size="sm"
            :class="['h-6 text-[10px] transition-all', elementGrayscale === 'average' ? 'bg-primary text-primary-foreground border-primary' : '']"
            @click="changeGrayscaleMode('average')"
          >
            Average
          </Button>
          <Button
            variant="outline"
            size="sm"
            :class="['h-6 text-[10px] transition-all', elementGrayscale === 'luminosity' ? 'bg-primary text-primary-foreground border-primary' : '']"
            @click="changeGrayscaleMode('luminosity')"
          >
            Luminosity
          </Button>
          <Button
            variant="outline"
            size="sm"
            :class="['h-6 text-[10px] transition-all', elementGrayscale === 'lightness' ? 'bg-primary text-primary-foreground border-primary' : '']"
            @click="changeGrayscaleMode('lightness')"
          >
            Bright
          </Button>
        </div>
      </div>

      <Separator class="my-1" />

      <!-- Filter Modes -->
      <div class="space-y-1.5">
        <Label class="text-[10px] font-bold uppercase tracking-wide flex items-center gap-1">
          <Paintbrush class="h-2.5 w-2.5" />
          Mode</Label>
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

      <!-- Matrix Filters -->
      <div class="space-y-1.5">
        <Label class="text-[10px] font-bold uppercase tracking-wide flex items-center gap-1">
          <Grid3x3 class="h-2.5 w-2.5" />
          Matrix</Label>
        <div class="grid grid-cols-3 gap-1">
          <Button
            v-for="filter in ['Sepia', 'BlackWhite', 'Brownie']"
            :key="filter"
            variant="outline"
            size="sm"
            :class="['h-6 text-[10px] transition-all', elementFilters.includes(filter) ? 'bg-primary text-primary-foreground border-primary' : '']"
            @click="toggleFilter(filter)"
          >
            {{ filter === 'BlackWhite' ? 'B&W' : filter }}
          </Button>
        </div>
        <div class="grid grid-cols-4 gap-1 mt-1">
          <Button
            v-for="filter in ['Vintage', 'Technicolor', 'Kodachrome', 'Polaroid']"
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

      <!-- Color Adjustments -->
      <div class="space-y-2">
        <Label class="text-[10px] font-bold uppercase tracking-wide">Color Adjustments</Label>
        
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
          <SliderWithTicks :model-value="[pixelate]" @update:model-value="(val) => val && (pixelate = val[0])" @value-commit="() => changeColorMode('Pixelate', pixelate)" :min="2" :max="20" :step="1" />
        </div>

        <div class="space-y-1.5">
          <div class="flex items-center justify-between">
            <span class="text-[10px] text-muted-foreground">Blur</span>
            <span class="text-[10px] font-mono">{{ blur.toFixed(2) }}</span>
          </div>
          <SliderWithTicks :model-value="[blur]" @update:model-value="(val) => val && (blur = val[0])" @value-commit="() => changeColorMode('Blur', blur)" :min="-1" :max="1" :step="0.01" />
        </div>
      </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from "vue";
import { storeToRefs } from "pinia";
import { useMainStore } from "@/store";
import { filters, Image } from "fabric";
import { ElementNames } from "@/types/elements";
import { SharpenMatrix, EmbossMatrix, GrayscaleType } from "@/configs/images";
import useCanvas from "@/views/Canvas/useCanvas";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import SliderWithTicks from '@/components/ui/slider/SliderWithTicks.vue';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Blend, Paintbrush, Grid3x3 } from 'lucide-vue-next';

const [canvas] = useCanvas();
const { canvasObject } = storeToRefs(useMainStore());
const handleElement = computed(() => canvasObject.value as Image);

const imageFilters = computed(() => {
  const filterList: string[] = [];
  handleElement.value.filters.forEach((item) => {
    if (item.type === "Convolute") {
      const itemMatrix = (item as filters.Convolute).matrix;
      if (
        itemMatrix.length === SharpenMatrix.length &&
        itemMatrix.every((v, i) => v === SharpenMatrix[i])
      ) {
        filterList.push("Sharpen");
      }
      if (
        itemMatrix.length === EmbossMatrix.length &&
        itemMatrix.every((v, i) => v === EmbossMatrix[i])
      ) {
        filterList.push("Emboss");
      }
    } else {
      if (!filterList.includes(item.type)) filterList.push(item.type);
    }
  });
  return filterList;
});

const imageGrayscale = computed(() => {
  let grayscale = "";
  handleElement.value.filters.forEach((item) => {
    if (item.type === GrayscaleType) {
      grayscale = (item as filters.Grayscale).mode;
    }
  });
  return grayscale;
});

const elementGrayscale = ref<string>(imageGrayscale.value);
const elementFilters = ref<string[]>(imageFilters.value);

const brightness = ref(0);
const contrast = ref(0);
const saturation = ref(0);
const vibrance = ref(0);
const hue = ref(0);
const noise = ref(0);
const pixelate = ref(0);
const blur = ref(0);

const hasFilter = computed(() => {
  if (!handleElement.value) return false;
  const elementType = handleElement.value.name
    ? handleElement.value.name
    : handleElement.value.type;
  if (elementType !== ElementNames.IMAGE) return false;
  const filters = handleElement.value.filters.filter(
    (obj) => obj.type !== "BlendColor"
  );
  if (filters && filters.length > 0) return true;
  return false;
});

const openFilter = ref<boolean>(hasFilter.value);

const changeGrayscaleMode = (mode: string) => {
  if (!handleElement.value) return;
  if (!handleElement.value.filters) handleElement.value.filters = [];
  mode === elementGrayscale.value
    ? (elementGrayscale.value = "")
    : (elementGrayscale.value = mode);
  if (elementGrayscale.value) {
    handleElement.value.filters.push(
      new filters.Grayscale({
        mode: elementGrayscale.value as any,
      }) as any
    );
    elementFilters.value.push(GrayscaleType);
  } else {
    handleElement.value.filters = handleElement.value.filters.filter(
      (obj) => obj.type !== GrayscaleType
    );
    elementFilters.value = elementFilters.value.filter(
      (obj) => obj !== GrayscaleType
    );
  }
  handleElement.value.applyFilters();
  canvas.renderAll();
};

const toggleFilter = (filterName: string) => {
  if (!handleElement.value) return;
  if (elementFilters.value.includes(filterName)) {
    elementFilters.value = elementFilters.value.filter(f => f !== filterName);
  } else {
    elementFilters.value.push(filterName);
  }
  changeFilters();
};

const changeFilters = () => {
  if (!handleElement.value) return;
  elementFilters.value.forEach((item) => {
    const itemFilter = handleElement.value.filters.filter(
      (obj) => obj.type === item
    )[0];
    if (!itemFilter) {
      if (item === "Invert") {
        handleElement.value.filters.push(
          new filters.Invert() as any
        );
      } else if (item === "Sepia") {
        // @ts-ignore
        handleElement.value.filters.push(new filters.Sepia());
      } else if (item === "BlackWhite") {
        // @ts-ignore
        handleElement.value.filters.push(new filters.BlackWhite());
      } else if (item === "Brownie") {
        // @ts-ignore
        handleElement.value.filters.push(new filters.Brownie());
      } else if (item === "Vintage") {
        // @ts-ignore
        handleElement.value.filters.push(new filters.Vintage());
      } else if (item === "Technicolor") {
        // @ts-ignore
        handleElement.value.filters.push(new filters.Technicolor());
      } else if (item === "Kodachrome") {
        // @ts-ignore
        handleElement.value.filters.push(new filters.Kodachrome());
      } else if (item === "Polaroid") {
        // @ts-ignore
        handleElement.value.filters.push(new filters.Polaroid());
      }
    }
  });
  handleElement.value.filters = handleElement.value.filters.filter((obj) =>
    elementFilters.value.includes(obj.type)
  );

  if (elementFilters.value.includes("Sharpen")) {
    handleElement.value.filters.push(
      new filters.Convolute({ matrix: SharpenMatrix }) as any
    );
  }
  if (elementFilters.value.includes("Emboss")) {
    handleElement.value.filters.push(
      new filters.Convolute({ matrix: EmbossMatrix }) as any
    );
  }
  handleElement.value.applyFilters();
  canvas.renderAll();
};

const changeColorMode = (type: string, value: number) => {
  if (!handleElement.value) return;
  if (type === "Brightness") {
    const brightnessFilter = new filters.Brightness({
      brightness: value,
    });
    handleElement.value.filters = handleElement.value.filters.filter(
      (obj) => obj.type !== type
    );
    handleElement.value.filters.push(brightnessFilter as any);
  } else if (type === "Contrast") {
    const contrastFilter = new filters.Contrast({ contrast: value });
    handleElement.value.filters = handleElement.value.filters.filter(
      (obj) => obj.type !== type
    );
    handleElement.value.filters.push(contrastFilter as any);
  } else if (type === "Saturation") {
    const saturationFilter = new filters.Saturation({
      saturation: value,
    });
    handleElement.value.filters = handleElement.value.filters.filter(
      (obj) => obj.type !== type
    );
    handleElement.value.filters.push(saturationFilter as any);
  } else if (type === "Vibrance") {
    const vibranceFilter = new filters.Vibrance({ vibrance: value });
    handleElement.value.filters = handleElement.value.filters.filter(
      (obj) => obj.type !== type
    );
    handleElement.value.filters.push(vibranceFilter as any);
  } else if (type === "Hue") {
    const hueFilter = new filters.HueRotation({ rotation: value });
    handleElement.value.filters = handleElement.value.filters.filter(
      (obj) => obj.type !== type
    );
    handleElement.value.filters.push(hueFilter as any);
  } else if (type === "Noise") {
    const noiseFilter = new filters.Noise({ noise: value });
    handleElement.value.filters = handleElement.value.filters.filter(
      (obj) => obj.type !== type
    );
    handleElement.value.filters.push(noiseFilter as any);
  } else if (type === "Pixelate") {
    const pixelateFilter = new filters.Pixelate({ blocksize: value });
    handleElement.value.filters = handleElement.value.filters.filter(
      (obj) => obj.type !== type
    );
    handleElement.value.filters.push(pixelateFilter as any);
  } else if (type === "Blur") {
    const blurFilter = new filters.Blur({ blur: value });
    handleElement.value.filters = handleElement.value.filters.filter(
      (obj) => obj.type !== type
    );
    handleElement.value.filters.push(blurFilter as any);
  }
  handleElement.value.applyFilters();
  canvas.renderAll();
};

const toggleFilters = (checked: boolean) => {
  openFilter.value = checked;
  if (!handleElement.value) return;
  if (!checked) {
    handleElement.value.filters.length = 0;
    handleElement.value.applyFilters();
    canvas.renderAll();
  }
};
</script>

<style lang="scss" scoped>
</style>
