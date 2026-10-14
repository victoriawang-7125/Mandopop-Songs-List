let split = SplitText.create(".split", { type: "words, chars" });

gsap.from(split.chars, {
  duration: 1, 
  y: 100,
  autoAlpha: 0,
  stagger: 0.05
});