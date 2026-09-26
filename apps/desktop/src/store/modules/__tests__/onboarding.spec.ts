import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useOnboardingStore } from '@/store/modules/onboarding'

const ONBOARDING_KEY = 'euclid_onboarding_completed'

describe('store/onboarding', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('starts fresh when no completion flag is stored', () => {
    const store = useOnboardingStore()
    expect(store.hasCompletedOnboarding).toBe(false)
    expect(store.isOnboardingActive).toBe(false)
  })

  it('hydrates hasCompletedOnboarding from localStorage', () => {
    localStorage.setItem(ONBOARDING_KEY, 'true')
    const store = useOnboardingStore()
    expect(store.hasCompletedOnboarding).toBe(true)
  })

  it('startOnboarding activates the tour', () => {
    const store = useOnboardingStore()
    store.startOnboarding()
    expect(store.isOnboardingActive).toBe(true)
  })

  it('completeOnboarding persists the flag and deactivates the tour', () => {
    const store = useOnboardingStore()
    store.startOnboarding()

    store.completeOnboarding()

    expect(store.hasCompletedOnboarding).toBe(true)
    expect(store.isOnboardingActive).toBe(false)
    expect(localStorage.getItem(ONBOARDING_KEY)).toBe('true')
  })

  it('skipOnboarding deactivates without persisting', () => {
    const store = useOnboardingStore()
    store.startOnboarding()

    store.skipOnboarding()

    expect(store.isOnboardingActive).toBe(false)
    expect(store.hasCompletedOnboarding).toBe(false)
    expect(localStorage.getItem(ONBOARDING_KEY)).toBeNull()
  })

  it('resetOnboarding clears the persisted flag', () => {
    localStorage.setItem(ONBOARDING_KEY, 'true')
    const store = useOnboardingStore()
    store.startOnboarding()

    store.resetOnboarding()

    expect(store.hasCompletedOnboarding).toBe(false)
    expect(store.isOnboardingActive).toBe(false)
    expect(localStorage.getItem(ONBOARDING_KEY)).toBeNull()
  })
})
