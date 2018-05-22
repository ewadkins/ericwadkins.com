(function($) {
  "use strict"; // Start of use strict

  // Smooth scrolling using jQuery easing
  $('a.js-scroll-trigger[href*="#"]:not([href="#"])').click(function() {
    if (location.pathname.replace(/^\//, '') == this.pathname.replace(/^\//, '') && location.hostname == this.hostname) {
      var target = $(this.hash);
      target = target.length ? target : $('[name=' + this.hash.slice(1) + ']');
      if (target.length) {
        $('html, body').animate({
          scrollTop: (target.offset().top - 53)
        }, 1000, "easeInOutExpo");
        return false;
      }
    }
  });
    
  $('html, body').on('mousewheel', function() {
    $('html, body').stop(); // Stops autoscrolling upon manual scrolling
  });

  // Closes responsive menu when a scroll trigger link is clicked
  $('.js-scroll-trigger').click(function() {
    $('.navbar-collapse').collapse('hide');
  });

  // Activate scrollspy to add active class to navbar items on scroll
  $('body').scrollspy({
    target: '#mainNav',
    offset: 56
  });

  // Collapse Navbar
  var navbarCollapse = function() {
    if ($("#mainNav").offset().top > 100) {
      $("#mainNav").addClass("navbar-shrink");
    } else {
      $("#mainNav").removeClass("navbar-shrink");
    }
  };
  // Collapse now if page is not at top
  navbarCollapse();
  // Collapse the navbar when page is scrolled
  $(window).scroll(navbarCollapse);

  // Hide navbar when modals trigger
  /*$('.portfolio-modal').on('show.bs.modal', function(e) {
    $(".navbar").addClass("d-none");
  })
  $('.portfolio-modal').on('hidden.bs.modal', function(e) {
    $(".navbar").removeClass("d-none");
  })*/
    

  // Scroll to top button appear
  $(document).scroll(function() {
    var scrollDistance = $(this).scrollTop();
    if (scrollDistance > 100) {
      $('.scroll-to-top').fadeIn();
    } else {
      $('.scroll-to-top').fadeOut();
    }
  });

    
  var triggeredFunction = function() {
    var s = document.createElement("script");
    s.setAttribute("src", "https://nthitz.github.io/turndownforwhatjs/tdfw.js");
    document.body.appendChild(s);
  };
  var clickCount = 0;
  var triggered = false;
  var timestamp = 0;
  $('#profile_pic').click(function() {
    if (new Date().getTime() - timestamp < 500) {
        clickCount++;
    } else {
        clickCount = 1;
    }
    timestamp = new Date().getTime();
    if (clickCount >= 5 && !triggered) {
      triggered = true;
      triggeredFunction();
    }
  });

})(jQuery); // End of use strict
