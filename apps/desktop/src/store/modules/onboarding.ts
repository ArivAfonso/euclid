import { defineStore } from 'pinia'
import { ref } from 'vue'

const ONBOARDING_KEY = 'euclid_onboarding_completed'

export const useOnboardingStore = defineStore('onboarding', () => {
  const isOnboardingActive = ref(false)

  /**
   * Reactive ref that stays in sync with localStorage.
   * Using a ref (not a computed) because localStorage.getItem()
   * is not a reactive dependency — a computed would cache its
   * first result forever and never re-evaluate.
   */
  const hasCompletedOnboarding = ref(
    localStorage.getItem(ONBOARDING_KEY) === 'true',
  )

  function startOnboarding() {
    isOnboardingActive.value = true
  }

  function completeOnboarding() {
    localStorage.setItem(ONBOARDING_KEY, 'true')
    hasCompletedOnboarding.value = true
    isOnboardingActive.value = false
  }

  function resetOnboarding() {
    localStorage.removeItem(ONBOARDING_KEY)
    hasCompletedOnboarding.value = false
    isOnboardingActive.value = false
  }

  function skipOnboarding() {
    isOnboardingActive.value = false
  }

  return {
    isOnboardingActive,
    hasCompletedOnboarding,
    startOnboarding,
    completeOnboarding,
    resetOnboarding,
    skipOnboarding,
  }
})
