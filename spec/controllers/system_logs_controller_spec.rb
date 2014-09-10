require 'spec_helper'

describe SystemLogsController do

  before :each do
    fake_login_as(Permission::SYSTEM)
  end

  it "should render index with correct page name" do
    get :index

    response.should render_template :index
    assigns[:page_name].should == "System Logs"
  end

  it "should assign all log entries to the view, ordered by the newest first" do
    LogEntry.should_receive(:by_created_at).with(:descending => true).and_return "all the log entries"

    get :index

    assigns(:log_entries).should == "all the log entries"
  end

  it "should only allow access to users with system settings permission" do
    @controller.current_ability.should_receive(:can?).with(:manage, ContactInformation).and_return(false)

    get :index

    response.code.should == "403"
  end

end
