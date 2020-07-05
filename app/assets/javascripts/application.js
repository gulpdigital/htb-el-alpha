/* global $ */

// Warn about using the kit in production
if (window.console && window.console.info) {
  window.console.info('GOV.UK Prototype Kit - do not use for production')
}

formatToFixed = (number) => {
  let num = number;
  num = parseFloat(num).toFixed(2)
  return `£${Number(num).toLocaleString('en')}` ;
}

$(document).ready(function () {
  window.GOVUKFrontend.initAll();

  if ($('#tt-default').length > 0) {
  // const URL = 'https://local-authority-eng.register.gov.uk/records.json?page-size=5000';
  const URL = '/public/javascripts/local-authority.json';
  $.getJSON( URL, {
    format: "json"
  })
  .done(function(data) {
    let items = [];
    console.log(data);
    $.each( data, function( key, val ) {
      console.log('data', data[key].item[0].name);
      items.push( data[key].item[0].name );
    });

    const element = document.querySelector('#tt-default');
    const id = 'local-authority'
    accessibleAutocomplete({
      element: element,
      id: id,
      source: items,
    });
      console.log('items', items);
    });
  }

  if ($('#findAuthorityByPostcode').length > 0) {

    const $findAuthorityByPostcode =  $('#findAuthorityByPostcode').find('input');
    const postcodeRegEx = '^([Gg][Ii][Rr] 0[Aa]{2})|((([A-Za-z][0-9]{1,2})|(([A-Za-z][A-Ha-hJ-Yj-y][0-9]{1,2})|(([AZa-z][0-9][A-Za-z])|([A-Za-z][A-Ha-hJ-Yj-y][0-9]?[A-Za-z]))))[0-9][A-Za-z]{2})$';

    $findAuthorityByPostcode.on('blur', function() {

      if ( $('#auto-local-authority').val().length) {
        $('#auto-local-authority').val('');
      }

      const value = $(this).val().replace(/\s/g, '');
      if ($(this).val().length && value.match(postcodeRegEx) !== null) {
        const postcode = value.toUpperCase().trim();
        const URL = `https://mapit.mysociety.org/postcode/${postcode}`;

        $('.fa-spinner-wrapper').addClass('show');

        $.getJSON( URL, {
          format: "json"
        })
        .done(function(data) {
          if (data) {
            const id = typeof data.shortcuts.council === 'number' ? data.shortcuts.council : data.shortcuts.council.county;
            const council = data.areas[id].name;
            
            $('#auto-local-authority').val(council);
            $('.fa-spinner-wrapper').removeClass('show');
            
          }
        });
      } else {
          $findAuthorityByPostcode.closest('.govuk-form-group').addClass('govuk-form-group--error');
          $findAuthorityByPostcode.addClass('govuk-input--error');
      }

    });

    $findAuthorityByPostcode.on('focus', function() {
      if ($('.govuk-form-group--error').length > 0 || $('.govuk-input--error').length > 0) {
          $findAuthorityByPostcode.closest('.govuk-form-group').removeClass('govuk-form-group--error');
          $findAuthorityByPostcode.removeClass('govuk-input--error');
      }
    });
  }
  
  /**
   * START: MINI SERVICE
   */

  const locationMap = {
    east: {regionName: 'East', cap: 407400, maxEquity: 20 },
    east_midlands: {regionName: 'East Midlands', cap: 261900, maxEquity: 20 },
    london: {regionName: 'London', cap: 600000, maxEquity: 40 },
    north_east: {regionName: 'North East', cap: 186100, maxEquity: 20 },
    north_west: {regionName: 'North West', cap: 224400, maxEquity: 20 },
    south_east: {regionName: 'South East', cap: 437600, maxEquity: 20 },
    south_west: {regionName: 'South West', cap: 349000, maxEquity: 20 },
    west_midlands: {regionName: 'West Midlands', cap: 255600, maxEquity: 20 },
    yorkshire_and_the_humber: {regionName: 'Yorkshire and The Humber', cap: 228100, maxEquity: 20 },
}

  $('.govuk-footer').on('click', '#clearSession', function() {
    window.sessionStorage.removeItem('userdata');
    window.sessionStorage.removeItem('figures');

    window.location.replace('/prototype-admin/clear-data');
  });

  const session = window.sessionStorage.getItem('userdata');
  const userdata = {};

    $('form').on('submit', function (e) {
      if ($('#location').length) {
        const location = $('input[name=location]:checked', '#location').val();

        if (location) {
          userdata['location'] = location;

          if (session === null ) {
            window.sessionStorage.setItem('userdata', JSON.stringify(userdata));
          } else {
            const sessionData = JSON.parse(session);
            sessionData['location'] = location;
            window.sessionStorage.setItem('userdata', JSON.stringify(sessionData));
          }
          return true;
        }

        return false;
      }

      if ($('#deposit').length) { 
        const deposit = $('input#deposit').val();
        const userdata = JSON.parse(session);
        userdata['deposit'] = deposit.replace('£', '').trim();
        window.sessionStorage.setItem('userdata', JSON.stringify(userdata));
      }

      if ($('#income').length) {
        const salary = $('input#salary').val();
        const overtime = $('input#overtime').val();
        const userdata = JSON.parse(session);
        userdata['salary'] = salary.replace('£', '').trim();
        userdata['overtime'] = overtime.replace('£', '').trim();
        window.sessionStorage.setItem('userdata', JSON.stringify(userdata));
      }

      if ($('#mortgage-amount').length) {
        const mortgage = $('input[name=mortgage]:checked', '#mortgage-amount').val();
        const mortgageAmount = $('#mortgage-number').val();
        const userdata = JSON.parse(session);

        if (mortgage === 'yes' && !mortgageAmount) {
          return false;
        }

        if (mortgage === 'no') {
          userdata['mortgageAvailable'] = 0;
        } else {
          userdata['mortgageAvailable'] = mortgageAmount.replace('£', '').trim();
        }
        window.sessionStorage.setItem('userdata', JSON.stringify(userdata));
      }
    });



    if ($('#examplePage').length) {
      const userdata = JSON.parse(session);
      const deposit = parseInt(userdata.deposit, 10);
      const salary = parseInt(userdata.salary, 10);
      const overtime = userdata.overtime ? parseInt(userdata.overtime, 10) : 0;
      const mortgageAvailable = !!userdata.mortgageAvailable;
      const income = parseInt(userdata.overtime, 10) > 0 ?  parseInt(userdata.salary, 10) + parseInt(userdata.overtime, 10) / 2 : parseInt(userdata.salary, 10);
      let maximumMortgageAmount = parseInt(userdata.mortgageAvailable, 10) === 0 ? income * 4.5 : parseInt(userdata.mortgageAvailable, 10);
      // const maxPurchasePrice = maximumMortgageAmount + deposit;
      const mortgageAndDeposit = maximumMortgageAmount + deposit;
      let maxPurchasePrice = mortgageAndDeposit / (1 - locationMap[userdata.location].maxEquity / 100);
      let originalMaximumMortgageAmount;
      let regionalCapExceeded = false;

      if (maxPurchasePrice > locationMap[userdata.location].cap) {
        regionalCapExceeded = true;
        maxPurchasePrice = locationMap[userdata.location].cap;
        originalMaximumMortgageAmount = maximumMortgageAmount;
        maximumMortgageAmount = maxPurchasePrice - deposit - (locationMap[userdata.location].maxEquity / 100 * maxPurchasePrice);
      }

      const maximumLoanAmount = locationMap[userdata.location].maxEquity / 100 * maxPurchasePrice;
      const regionName = locationMap[userdata.location].regionName;

      const figures = {
        salary: formatToFixed(salary),
        overtime: formatToFixed(overtime),
        deposit: formatToFixed(deposit),
        income: formatToFixed(income),
        maximumMortgageAmount: formatToFixed(maximumMortgageAmount),
        originalMaximumMortgageAmount: formatToFixed(originalMaximumMortgageAmount),
        maxPurchasePrice: formatToFixed(maxPurchasePrice),
        maximumLoanAmount: formatToFixed(maximumLoanAmount),
        maximumLoanPercentage: locationMap[userdata.location].maxEquity,
        purchasePriceCap: formatToFixed(locationMap[userdata.location].cap),
        showWarning: userdata.mortgageAvailable < 1,
      }
      window.sessionStorage.setItem('figures', JSON.stringify(figures));


      const textMapping = {
        '###MAXIMUM_MORTGAGE_AMOUNT###': figures.maximumMortgageAmount,
        '###ORIGINAL_MAX_MORTGAGE_AMOUNT###': figures.originalMaximumMortgageAmount,
        '###MAXIMUM_EL_LOAN_AMOUNT###': figures.maximumLoanAmount,
        '###MAX_PURCHASE_PRICE###': figures.maxPurchasePrice,
        '###DEPOSIT###': figures.deposit, 
        '###INCOME###': figures.salary,
        '###OVERTIME###': figures.overtime,
        '###REGIONAL_CAP###': figures.purchasePriceCap,
        '###REGION_NAME###': regionName,
        '###MAXIMUM_LOAN_PERCENTAGE###': `${figures.maximumLoanPercentage}%`,
      }

      const placeholder = document.querySelectorAll('.text-placeholder');

      placeholder.forEach(element => {
        element.innerHTML = textMapping[element.innerHTML];
      });

      if(overtime === 0) {
        $('.overtime').hide();
      }

      if(regionalCapExceeded) {
        $('.standard-messaging').hide();
        $('.regional-cap-exceeded').show();
      } else {
        $('.standard-messaging').show();
        $('.regional-cap-exceeded').hide();
      }

      if(mortgageAvailable) {
        $('.mortgage-unknown').hide();
      } else {
        $('.mortgage-known').hide();
      }

      if(regionalCapExceeded) {
        $('.maximum-mortgage-amount').addClass('warning');

        if(mortgageAvailable) {
          $('.mortgage-known-and-regional-cap-exceeded').show();
          $('.mortgage-unknown-and-regional-cap-exceeded').hide();
        } else {
          $('.mortgage-unknown-and-regional-cap-exceeded').show();
          $('.mortgage-known-and-regional-cap-exceeded').hide();
        }
      } else {
        $('.mortgage-unknown-and-regional-cap-exceeded').hide();
        $('.mortgage-known-and-regional-cap-exceeded').hide();
      }

      console.log('figures', figures);
    }
  
    /**
   * END: MINI SERVICE
   */


  $(window).bind("load", function() { 
       
    let pageYOffset = 0,
        contentsHeight = 0,
        contentsTop = 0,
        $contents = $('#contents'),
        $fixedFooter = $('#fixed-footer'),
        $backToTop = $('#app-c-back-to-top');
      
    positionFooter();
    
    function positionFooter() {

      if ($contents.length) {

        pageYOffset = window.pageYOffset;
        backToTopPos = $backToTop.offset().top;
        contentsTop = $contents.offset().top;
        contentsHeight = $contents.outerHeight();

        if (pageYOffset > contentsTop + contentsHeight) {
            $fixedFooter.css('display', 'block');
        } else {
            $fixedFooter.css('display', 'none');
        }

        if (($fixedFooter.offset().top > backToTopPos + $backToTop.outerHeight())){
          $fixedFooter.css('display', 'none');
        }
      }
    }

    $(window)
            .scroll(positionFooter)
            .resize(positionFooter)
            
}); 

  $('body').on('click', 'a', function(event) {
    if ($(this).attr('href') === '#' || $(this).attr('href') === '') {
        event.preventDefault();
    }
  });

  const backLink = $('body').find('.govuk-back-link:not(.noBack)');

  backLink.on('click', function ( event ) {
      event.preventDefault();
      window.history.back();
  });

  $('.radio-routes-toggle').on('change', 'input:radio', function () {
    const el = $(this);
    const path = el.data('action-url') || el.data('path');
    if (path) {
      el.closest('form').attr('action', path);
    }
  });

  // Need to remove - Nasty
  if ($('.ineligible-area').length > 0) {
    if ($('.ineligible-area').find('a').hasClass('Scotland')) {
      $('.ineligible-area').find('a').attr('href', 'https://www.mygov.scot/help-to-buy/overview/');
    }
    if ($('.ineligible-area').find('a').hasClass('Wales')) {
      $('.ineligible-area').find('a').attr('href', 'https://gov.wales/buying-selling-property');

    }
    if ($('.ineligible-area').find('a').hasClass('Northern Ireland')) {
      $('.ineligible-area').find('a').attr('href', 'https://www.housingadviceni.org/help-buy-home');
    }
  }

  $('.purchase-form').on('submit', function( event ) {
    // event.preventDefault();

    const value = $(this).find('#propertyPrice').val();
    const $propertyPriceField = $(this).find('#propertyPrice');
    const $propertyPriceGroup = $propertyPriceField.closest('.govuk-form-group');
    const $propertyPriceError = $propertyPriceGroup.find('.govuk-error-message');

    // if ($(this).find('.govuk-form-group--error') || value > 600000) {
    //   return
    // }

    if (value > 600000) {
      $propertyPriceGroup.addClass('govuk-form-group--error');
      $propertyPriceField.addClass('govuk-input--error');
      $([document.documentElement, document.body]).animate({
        scrollTop: $propertyPriceGroup.offset().top
    }, 500);
      return false;
    } else {
      $propertyPriceGroup.removeClass('govuk-form-group--error');
      $propertyPriceField.removeClass('govuk-input--error');
      return true;
    }
  });

  // Task list
  let tasklist = {};
  if (window.sessionStorage.getItem('tasklist')) {
    tasklist = JSON.parse(window.sessionStorage.getItem('tasklist'));
  }

  $('form').on('submit', function (e) {
    const lastSlashPosition = location.pathname.lastIndexOf('/');
    const pageName = location.pathname.substr(lastSlashPosition + 1);
    tasklist[pageName] = true;
    window.sessionStorage.setItem('tasklist', JSON.stringify(tasklist));
  });

  if ($('.app-task-list').length) {
    $('.app-task-list .app-task-list__item').each(function(i, el) {
      if(tasklist[$(el).find('span > a').attr('href')]) {
        $(el).find('strong')
          .removeClass('govuk-tag--grey')
          .addClass('govuk-tag--blue')
          .text('Done');
      } else {
        $(el).find('strong')
          .removeClass('govuk-tag--blue')
          .addClass('govuk-tag--grey')
          .text('To do');
      }
    });
  }
  // End task list
})