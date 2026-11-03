const myObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        const target = entry.target;
        if (entry.isIntersecting) {
            if (target.classList.contains('reveal')) {
                target.classList.add('show');
            }
            if (target.classList.contains('reveal02')) {
                target.classList.add('show02');
            }
            if (target.classList.contains('reveal03')) {
                target.classList.add('show03');
            }
        } else {
            if (target.classList.contains('reveal')) {
                target.classList.remove('show');
            }
            if (target.classList.contains('reveal02')) {
                target.classList.remove('show02');
            }
            if (target.classList.contains('reveal03')) {
                target.classList.remove('show03');
            }
        }
    });
});

const elements = document.querySelectorAll('.reveal, .reveal02, .reveal03');
elements.forEach((element) => myObserver.observe(element));