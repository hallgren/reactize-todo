reactize-todo
=============

todomvc in reactize.js

The cool thing with Reactize is that it makes it possible to brings the web back to pure HTML but still make it pretty simple to create a responsive site. I have tryied to show this by implementing the todoMVC application with reactize.js with all the state changes happening on the backend. This example is working in javascript disabled mode with ordinary page loads. Javascript has been used to progressively enhance the experience by bringing in ajax to make the site more responsive but not leaving the mission that state changes should only be made on the backend and that HTML should be used to transfer data.


#### Running locally

1. Clone this repo

        $ git clone https://github.com/hallgren/reactize-todo.git

2. Install bundle dependencies

        $ bundle install

3. Run the server (change the port with the `-p` flag)

        $ bundle exec rackup

4. Visit the app: [http://localhost:9292](http://localhost:9292)


#### Live demo

[https://reactize-todo.herokuapp.com/](https://reactize-todo.herokuapp.com/)
