/*!
 * Start Bootstrap - Agency Bootstrap Theme (http://startbootstrap.com)
 * Code licensed under the Apache License v2.0.
 * For details, see http://www.apache.org/licenses/LICENSE-2.0.
 */

// jQuery for page scrolling feature - requires jQuery Easing plugin
$(function() {
    $('a.page-scroll').bind('click', function(event) {
        var $anchor = $(this);
        $('html, body').stop().animate({
            scrollTop: $($anchor.attr('href')).offset().top
        }, 1000, 'easeInOutExpo'/*'easeInOutQuad'*/);
        event.preventDefault();
    });
    
    $('html, body').on('mousewheel', function() {
        $('html, body').stop(); // Stops autoscrolling upon manual scrolling
    });
    
    /*window.MutationObserver = window.MutationObserver
    || window.WebKitMutationObserver
    || window.MozMutationObserver;
    var observer = new MutationObserver(function(mutation) {
        if (mutation[0].target.height !== 'auto') {
            mutation[0].target.height = 'auto';
        }
    });
    $('iframe[id^="ghcard-ewadkins-"]').each(function() {
        observer.observe($(this)[0], { attributes: true });
    });*/
    
    $('.resizableImage').mouseenter(function() {
        $(this).stop().animate({ width: $(this).attr('width') * 1.1, height: $(this).attr('height') * 1.1 });
    });

    $('.resizableImage').mouseleave(function() {
        var x = $(this).attr('width'),
            y = $(this).attr('height');

        $(this).stop().animate({ width: x, height: y });
    });

  // Scroll to top button appear
  $(document).scroll(function() {
    var scrollDistance = $(this).scrollTop();
    if (scrollDistance > 100) {
      $('.scroll-to-top').fadeIn();
    } else {
      $('.scroll-to-top').fadeOut();
    }
  });
});

// Highlight the top nav as scrolling occurs
$('body').scrollspy({
    target: '.navbar-fixed-top'
})

// Closes the Responsive Menu on Menu Item Click
$('.navbar-collapse ul li a').click(function() {
    $('.navbar-toggle:visible').click();
});

function resizeVideo() {
    $('#video').height($('#header').height() + 'px')
}
window.addEventListener('resize', resizeVideo);