/*
 * ads.js - portal / ad SDK adapter.
 *
 * The game NEVER talks to an SDK directly; it only calls the functions below.
 * That keeps the game portal-agnostic. Hook points used by ui.js (search for "AD HOOK"):
 *
 *   Ads.loadingFinished()     -> when the first playable state is ready
 *   Ads.gameplayStart()       -> player starts / resumes / is revived
 *   Ads.gameplayStop()        -> pause, game over, menu
 *   Ads.midgame()             -> natural break: after game over, when the player taps "Play again"
 *                                (CrazyGames: ad.requestAd('midgame') | Poki: commercialBreak())
 *   Ads.rewarded()            -> player explicitly clicked a "watch ad" button
 *                                (CrazyGames: requestAd('rewarded') | Poki: rewardedBreak())
 *                                resolves true ONLY if the reward must be granted.
 *   Ads.celebrate()           -> new high score (CrazyGames happytime)
 *
 * Providers:
 *   'crazygames' - window.CrazyGames.SDK (v3) present and environment != 'disabled'
 *   'poki'       - window.PokiSDK present
 *   'sim'        - no SDK, running on localhost / file:// or ?adsim=1 -> fake 1.5 s ad overlay so you can test the flow
 *   'none'       - no SDK on a real host (e.g. CrazyGames Basic Launch): midgame is a no-op, rewarded buttons are hidden
 *
 * Portal rules honoured (see README): game is paused + muted while an ad runs, adError => no reward,
 * game keeps working with ad blockers, rewarded offers are optional and never chained.
 */
(function () {
  const Ads = {
    provider: 'none',
    busy: false,
    onAdStart: function () {},   // set by ui.js: pause + mute
    onAdEnd: function () {},     // set by ui.js: resume + unmute
    lastRewardedAt: -1e9,
    REWARD_COOLDOWN_MS: 15000,   // CrazyGames: "do not offer rewarded too often"

    async init() {
      const qs = new URLSearchParams(location.search);
      try {
        if (window.CrazyGames && window.CrazyGames.SDK) {
          await window.CrazyGames.SDK.init();
          if (window.CrazyGames.SDK.environment !== 'disabled') this.provider = 'crazygames';
        } else if (window.PokiSDK) {
          try { await window.PokiSDK.init(); } catch (e) { /* load the game anyway, as Poki docs say */ }
          this.provider = 'poki';
        }
      } catch (e) { console.warn('[ads] SDK init failed, continuing without ads', e); }
      if (this.provider === 'none') {
        const local = location.protocol === 'file:' || /^(localhost|127\.0\.0\.1)$|github\.io$/.test(location.hostname);
        if (qs.get('adsim') === '1' || (local && qs.get('adsim') !== '0')) this.provider = 'sim';
      }
      if (this.provider === 'crazygames') {
        try { window.CrazyGames.SDK.game.loadingStart(); } catch (e) {}
      }
      return this.provider;
    },

    /** Portal-provided locale (CrazyGames systemInfo.locale), else undefined. */
    locale() {
      try { if (this.provider === 'crazygames') return window.CrazyGames.SDK.user.systemInfo.locale; } catch (e) {}
      try { const l = new URLSearchParams(location.search).get('lang'); if (l) return l; } catch (e) {}
      return undefined;
    },
    /** CrazyGames can force the game muted via SDK settings. Returns true if portal wants silence. */
    portalMuted() {
      try { if (this.provider === 'crazygames') return !!window.CrazyGames.SDK.game.settings.muteAudio; } catch (e) {}
      return false;
    },
    onPortalSettings(cb) {
      try { if (this.provider === 'crazygames') window.CrazyGames.SDK.game.addSettingsChangeListener(cb); } catch (e) {}
    },

    loadingFinished() {
      try {
        if (this.provider === 'crazygames') window.CrazyGames.SDK.game.loadingStop();
        if (this.provider === 'poki') window.PokiSDK.gameLoadingFinished();
      } catch (e) {}
    },
    gameplayStart() {
      try {
        if (this.provider === 'crazygames') window.CrazyGames.SDK.game.gameplayStart();
        if (this.provider === 'poki') window.PokiSDK.gameplayStart();
      } catch (e) {}
    },
    gameplayStop() {
      try {
        if (this.provider === 'crazygames') window.CrazyGames.SDK.game.gameplayStop();
        if (this.provider === 'poki') window.PokiSDK.gameplayStop();
      } catch (e) {}
    },
    celebrate() { try { if (this.provider === 'crazygames') window.CrazyGames.SDK.game.happytime(); } catch (e) {} },

    /** Rewarded buttons are only shown when this is true. */
    rewardedAvailable() {
      if (this.provider === 'none') return false;
      return (performance.now() - this.lastRewardedAt) > this.REWARD_COOLDOWN_MS;
    },
    rewardedCooldownLeft() { return Math.max(0, Math.ceil((this.REWARD_COOLDOWN_MS - (performance.now() - this.lastRewardedAt)) / 1000)); },

    /** MIDGAME / interstitial. Always resolves; never blocks the game if no ad is available. */
    midgame() {
      if (this.busy || this.provider === 'none') return Promise.resolve();
      this.busy = true;
      const done = () => { this.busy = false; this.onAdEnd(); };
      if (this.provider === 'crazygames') {
        return new Promise((res) => {
          window.CrazyGames.SDK.ad.requestAd('midgame', {
            adStarted: () => this.onAdStart(),
            adFinished: () => { done(); res(); },
            adError: () => { done(); res(); },   // unfilled / cooldown / adblock => just continue
          });
        });
      }
      if (this.provider === 'poki') {
        return window.PokiSDK.commercialBreak(() => this.onAdStart()).then(done, done);
      }
      return this._fake('midgame').then(done);
    },

    /** REWARDED. Resolves true only if the ad was fully shown (grant the reward), false otherwise (no reward). */
    rewarded() {
      if (this.busy || !this.rewardedAvailable()) return Promise.resolve(false);
      this.busy = true;
      const done = (ok) => { this.busy = false; if (ok) this.lastRewardedAt = performance.now(); this.onAdEnd(); return ok; };
      if (this.provider === 'crazygames') {
        return new Promise((res) => {
          window.CrazyGames.SDK.ad.requestAd('rewarded', {
            adStarted: () => this.onAdStart(),
            adFinished: () => res(done(true)),
            adError: () => res(done(false)),     // adError => do NOT reward
          });
        });
      }
      if (this.provider === 'poki') {
        return window.PokiSDK.rewardedBreak(() => this.onAdStart()).then((ok) => done(!!ok), () => done(false));
      }
      return this._fake('rewarded').then(() => done(true));
    },

    /** Local test overlay (provider 'sim' only). */
    _fake(kind) {
      this.onAdStart();
      const el = document.getElementById('fakeAd'), bar = document.getElementById('fakeAdBar');
      document.getElementById('fakeAdTxt').textContent = 'AD (' + kind + ') - local simulation';
      el.classList.add('on'); bar.style.width = '0%';
      return new Promise((res) => {
        const t0 = performance.now(), dur = window.__adSimMs || 1500;
        const iv = setInterval(() => {
          const p = Math.min(1, (performance.now() - t0) / dur); bar.style.width = (p * 100) + '%';
          if (p >= 1) { clearInterval(iv); el.classList.remove('on'); res(); }
        }, 50);
      });
    },
  };
  window.Ads = Ads;
})();
