require "sinatra"

enable :sessions

get "/" do
  @todos = todos
  @completed_count = completed.length
  @active_count = active.length
  erb :index
end

get "/completed" do
  @todos = completed
  erb :index
end

get "/active" do
  @todos = active
  erb :index
end

post "/" do
  erb  :partial
end

get "/partial_clone" do
  erb  :partial_clone
end

private

def no_todos
  []
end

def completed
  todos.select { |todo| todo[:completed] }
end

def active
  todos.select { |todo| !todo[:completed] }
end

def todos
  [{:text => "not completed", :completed => false}, {:text => "completed", :completed => true}]
end