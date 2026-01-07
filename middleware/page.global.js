export default defineNuxtRouteMiddleware((to, from) => {
  if (import.meta.client) {
    const { toggleTransitionComplete } = usePageTransition();

    from.meta.pageTransition.onLeave = (el, done) => {
      toggleTransitionComplete(false);
      gsap
        .timeline({
          paused: true,
          onComplete: () => {
            window.scrollTo(0, 0);
            done();
          },
        })
        .to(el, { scale: 0.8, duration: 1, ease: "Expo.easeOut" })
        .to(el, {
          xPercent: 100,
          autoAlpha: 0,
          duration: 1,
          ease: "Expo.easeOut",
        })
        .play();
    };

    to.meta.pageTransition.onEnter = (el, done) => {
      gsap.set(el, { autoAlpha: 0, scale: 0.8, xPercent: -100 });
      gsap
        .timeline({
          paused: true,
          onComplete() {
            toggleTransitionComplete(true);
            done();
          },
        })
        .to(el, {
          autoAlpha: 1,
          xPercent: 0,
          duration: 1,
          ease: "Expo.easeOut",
        })
        .to(el, { scale: 1, duration: 1, ease: "Expo.easeOut" })
        .play();
    };
  }
});
