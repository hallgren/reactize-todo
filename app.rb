require "sinatra"

enable :sessions
enable :protection
set :protection, except: :session_hijacking


get "/" do
  
  @todos = todos
  @completed_count = completed.length
  @active_count = active.length
  @all_completed = all_completed? @todos
  @show_footer = @todos.length > 0
  erb :index
end

get "/?:route?/edit/:id" do
  
  @todos = todos
  @edit_id = params[:id]
  @route = params[:route]

  if request.xhr?
    erb :todos
  else
    @completed_count = completed.length
    @active_count = active.length
    @all_completed = all_completed? @todos
    @show_footer = @todos.length > 0
    erb :index
  end
end

get "/?:route?/todos" do
  @todos = todos
  @route = params[:route]
  erb :todos
end

get "/footer" do
  @todos = todos
  @completed_count = completed.length
  @active_count = active.length
  @show_footer = todos.length > 0
  erb :footer
end

get "/completed" do
  @todos = completed
  @route = "completed"
  @show_footer = todos.length > 0
  erb :index
end

get "/active" do
  @todos = active
  @route = "active"
  @show_footer = todos.length > 0
  erb :index
end

post "/?:route?/new_todo" do
  add_todo({:text => params[:title], :completed => false, :id => rand(36**8).to_s(36)})

  if request.xhr?
    @todos = todos
    @route = params[:route]
    erb :todos
  else
    redirect "/#{params[:route]}"
  end
end

post "/?:route?/destroy/:id" do
  destroy_todo(params[:id])
  if request.xhr?
    @todos = todos
    @route = params[:route]
    erb :todos
  else
    redirect "/#{params[:route]}"
  end
end

get "/toggle_all" do
  @todos = todos
  @all_completed = all_completed? @todos
  erb :toggle_all
end

post "/?:route?/complete/:id" do
  complete_todo params[:id]
  if request.xhr?
    @todos = todos
    @route = params[:route]
    erb :todos
  else
    redirect "/#{params[:route]}"
  end
end

post "/?:route?/reactivate/:id" do
  reactivate_todo params[:id]
  if request.xhr?
    @todos = todos
    @route = params[:route]
    erb :todos
  else
    redirect "/#{params[:route]}"
  end
end

post "/?:route?/edit/:id" do
  edit_todo params[:id], params[:text]
  if request.xhr?
    @todos = todos
    @route = params[:route]
    erb :todos
  else
    redirect "/#{params[:route]}"
  end
end

post "/?:route?/complete_all" do
  complete_all_todos
  if request.xhr?
    @todos = todos
    @all_completed = all_completed? @todos
    @route = params[:route]
    erb :toggle_all
  else
    redirect "/#{params[:route]}"
  end
end

post "/?:route?/reactivate_all" do
  reactivate_all_todos
  if request.xhr?
    @todos = todos
    @all_completed = all_completed? @todos
    @route = params[:route]
    erb :toggle_all
  else
    redirect "/#{params[:route]}"
  end
end

post "/?:route?/clear_completed" do
  clear_completed_todos
  if request.xhr?
    @todos = todos
    @completed_count = completed.length
    @active_count = active.length
    @route = params[:route]
    @show_footer = @todos.length > 0
    erb :footer
  else
    redirect "/#{params[:route]}"
  end
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
  return session[:todos] unless session[:todos] == nil
  return []
  #[{:text => "not completed", :completed => false}, {:text => "completed", :completed => true}]
end

def add_todo todo
  session[:todos] = [] if session[:todos] == nil
  session[:todos] << todo
end

def destroy_todo id
  session[:todos].delete_if { |todo| todo[:id] == id } 
end

def complete_todo id
  todo = find_todo_by_id id
  todo[:completed] = true
end

def reactivate_todo id
  todo = find_todo_by_id id
  todo[:completed] = false
end

def edit_todo id, text
  todo = find_todo_by_id id
  todo[:text] = text
end

def find_todo_by_id id
  session[:todos].select { |todo| todo[:id] == id }.first
end

def all_completed? ts
  return true if ts.select { |todo| todo[:completed] == false }.empty?
  false
end

def complete_all_todos
  todos.map { |todo| todo[:completed] = true }
end

def reactivate_all_todos
  todos.map { |todo| todo[:completed] = false }
end

def clear_completed_todos
  todos.delete_if { |todo| todo[:completed] == true } 
end
