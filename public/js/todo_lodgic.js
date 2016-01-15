  $(document).ready(function(){

    Krumelur.apply(document.getElementById("todo-list"), document.getElementById("todo-list"));
    Krumelur.apply(document.getElementById("foot"), document.getElementById("foot"));
    Krumelur.apply(document.getElementById("toggle_all"), document.getElementById("toggle_all"));

    //Hide submit on toggle-all if js is activated
    $("#toggle-all-submit").hide();

    //Set the current route and remove last /
    window.route = window.location.pathname.replace(/\/$/, '');

    if (history.pushState) {
      // supported.
      $(document).on("click", ".route", function(element){
        window.route = element.target.pathname.replace(/\/$/, '');
        var stateObj = { route: element.target.pathname };
        history.pushState(stateObj, element.target.pathname, element.target.pathname);
        $(window).trigger("new_route", element.target.pathname);
        return false;
      });

      window.onpopstate = function(event) {
        window.route = event.state.route.replace(/\/$/, '');
        $(window).trigger("new_route", event.state.route)
      };
    }

    $(document).on("click", "#toggle_all", function(element) {
      href = element.target.form.action
      $.post(href, function(data) {
        Krumelur.apply(data, document.getElementById("toggle_all"));
        $(window).trigger("toggle_all-update");
      });
      return false
    });

    $(document).on("click", ".toggle", function(element) {
      href = element.target.form.action
      $.post(href, function(data) {
        Krumelur.apply(data, document.getElementById("todo-list"));
        $(window).trigger("todo-list-update");
      });
      return false
    });

    $(document).on("click", ".destroy", function(element) {
      href = element.target.form.action
      $.post(href, function(data) {
        Krumelur.apply(data, document.getElementById("todo-list"));
        $(window).trigger("todo-list-update");
      });
      return false
    });


    $(document).on("click", ".edit_me", function(element) {
      href = element.target.parentElement.href
      $.get(href, function(data) {
        Krumelur.apply(data, document.getElementById("todo-list"));
      });
      return false
    });

    $(document).on("submit", "#form-new_todo", function(element) {
      href = element.currentTarget.action
      $.post(href, {"title": element.target[0].value} , function(data) {
        Krumelur.apply(data, document.getElementById("todo-list"));
        $(window).trigger("todo-list-update");
      });
      $("#new-todo").val("");
      return false
    });

    $(document).on("submit", ".form-edit", function(element) {
      href = element.currentTarget.action
      $.post(href, {"text": element.target[0].value} , function(data) {
        Krumelur.apply(data, document.getElementById("todo-list"));
        $(window).trigger("todo-list-update");
      });
      return false
    });

    $(window).on("footer-update toggle_all-update new_route", function(){
      href = window.route + "/todos" //$('body').find('a[rel=todos]').attr("href")
      $.get(href, function(data) {
        Krumelur.apply(data, document.getElementById("todo-list"));
      });
      return false
    });

    $(window).on("todo-list-update toggle_all-update new_route", function(){
      href = window.route + "/footer";// $('body').find('a[rel=footer]').attr("href")
      $.get(href, function(data) {
        Krumelur.apply(data, document.getElementById("foot"));
      });
      return false
    });

    $(window).on("todo-list-update footer-update new_route", function(){
      href = "/toggle_all"; //$('body').find('a[rel=toggle_all]').attr("href")
      $.get(href, function(data) {
        Krumelur.apply(data, document.getElementById("toggle_all"));
        //Hide submit if it was not in the page on page load
        $("#toggle-all-submit").hide();
      });
      return false
    });

    $(document).on("click", "#clear-completed", function(element) {
      href = element.target.form.action
      $.post(href, function(data) {
        Krumelur.apply(data, document.getElementById("foot"));
        $(window).trigger("footer-update");
      });
      return false
    });
    
  });

