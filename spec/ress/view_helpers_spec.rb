require 'rspec'
require_relative '../../lib/ress'

describe ActionView::Base do

  describe '#ress_link_tags' do

    let(:view) { ActionView::Base.new }
    let(:request) { stub('request', :protocol => 'http://', :host_with_port => 'foo.com', :fullpath => '/bar', :subdomain => 'x') }
    let(:category) { Ress::DeviceCategory.new('m', 'stuff') }

    before do
      view.stub(:request => request)
    end

    context 'alternate request' do

      before { view.stub(:canonical_request? => false) }

      it 'returns an empty string if there are no registered categories' do
        view.ress_link_tags.should == ''
      end

      it 'generates the link tags when there is on category' do
        Ress.configure do |r|
          r.add_alternate :name => 'm', :media_type => 'stuff'
        end
        view.ress_link_tags.should ==
          "<link href=\"http://m.foo.com/bar\" id=\"m\" media=\"stuff\" rel=\"alternate\" />"
      end
    end

    context 'canonical request' do

      before { view.stub(:canonical_request? => true) }

      it 'returns the canonical link' do
        view.ress_link_tags.should == "<link href=\"http://foo.com/bar\" rel=\"canonical\" />"
      end

    end

  end

end