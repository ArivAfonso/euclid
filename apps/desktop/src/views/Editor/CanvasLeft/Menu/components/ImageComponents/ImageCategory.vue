<template>
  <div>
    <div
      class="category-container"
      ref="categoryRef"
      @scroll="onCategoryScroll"
      v-if="typeRef === 'all'"
    >
      <div v-for="(item, index) in imageCategoryData" :key="index">
        <div class="flex justify-between items-center mt-1">
          <div class="text-center flex-1">
            <Badge>{{ item.name }}</Badge>
          </div>
          <div class="text-center flex-1">
            <Button variant="ghost" size="sm" @click="showTotal(item.type)">
              All<ChevronRight :size="16" class="ml-1" />
            </Button>
          </div>
        </div>
        <div
          class="category-box mt-1"
        >
          <div
            class="box-image"
            :style="{
              width:
                (img.height <= 120
                  ? (img.width / img.height) * 120
                  : img.width) + 'px',
            }"
            v-for="(img, index) in item.category"
            :key="index"
          >
            <img
              :src="img.preview"
              :alt="img.tags"
              @click="createImage(img)"
            />
          </div>
        </div>
      </div>
    </div>
    <div
      class="category-container"
      ref="totalRef"
      @scroll="onTotalScroll"
      v-else
    >
      <div class="flex justify-start items-center mt-1">
        <Button variant="ghost" size="sm" @click="hideTotal()">
          <ChevronLeft :size="16" class="mr-1" />{{ categoryData.name }}
        </Button>
      </div>
      <div
        class="total-box mt-1"
      >
        <div
          class="box-image"
          v-for="(img, index) in categoryData.total"
          :key="index"
          :style="{
            justifyContent: index % 2 === 0 ? 'flex-start' : 'flex-end',
          }"
        >
          <img
            :src="img.preview"
            :alt="img.tags"
            @click="createImage(img)"
          />
        </div>
      </div>
    </div>
    <div class="flex justify-center pt-5 mb-32">End~</div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from "vue";
import type { ImageHit } from "@/types/elements";
import { useMainStore } from "@/store";
import { storeToRefs } from "pinia";
import useHandleCreate from "@/hooks/useHandleCreate";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, ChevronLeft } from "lucide-vue-next";
const mainStore = useMainStore();
const { imageCategoryType, imageCategoryData } = storeToRefs(mainStore);
const { createImageElement } = useHandleCreate();

const categoryRef = ref<HTMLDivElement>();
const totalRef = ref<HTMLDivElement>();
const categoryTop = ref(0);
const typeRef = ref("all");
const categoryData = computed(() => {
  return imageCategoryData.value.filter((ele) => ele.type === typeRef.value)[0];
});

const getContainScroll = () => {
  let startIndex = 0,
    endIndex = 2;
  if (!categoryRef.value)
    return {
      startIndex,
      endIndex,
    };
  const scrollTop = categoryRef.value.scrollTop;
  const containerHeight = categoryRef.value.clientHeight;
  const itemHeight = 132;
  startIndex = Math.floor(scrollTop / itemHeight);
  endIndex = Math.ceil((scrollTop + containerHeight) / itemHeight);
  return {
    startIndex,
    endIndex,
  };
};

const onCategoryScroll = async () => {
  // Stock image API removed — kept as placeholder
};

const onTotalScroll = async () => {
  // Stock image API removed — kept as placeholder
};

const showTotal = async (type: string) => {
  if (!categoryRef.value) return;
  categoryTop.value = categoryRef.value.scrollTop;
  typeRef.value = type;
};

const hideTotal = () => {
  typeRef.value = "all";
  if (!categoryRef.value) return;
  categoryRef.value.scrollTo({ top: categoryTop.value, behavior: "smooth" });
};

const createImage = (item: ImageHit) => {
  createImageElement(item.largeImageURL);
};
</script>

<style lang="scss" scoped>
.mt-1 {
  margin-top: 0.25rem;
}
.category-box {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  overflow: hidden;
  height: 100px;
  .box-image {
    display: flex;
    align-items: center;
    padding: 0 2px;
    &:first-child {
      justify-content: flex-start;
    }
    &:last-child {
      justify-content: flex-end;
    }
    img {
      max-width: 100%;
      cursor: pointer;
    }
  }
}

.category-container {
  overflow-y: scroll;
  height: 100vh;
  align-items: center;
}
.total-box {
  display: flex;
  flex-wrap: wrap;
  .box-image {
    padding: 2px;
    width: 48%;
    height: 120px;
    overflow: hidden;
    display: flex;
    img {
      max-width: 100%;
    }
  }
}
</style>

