# frozen_string_literal: true

# Uses a cache to interact with Locations
class LocationService
  attr_accessor :locations_by_code, :with_cache

  def self.instance
    new(Rails.env.production?)
  end

  def initialize(with_cache = false)
    self.with_cache = with_cache
  end

  def rebuild_cache(force = false)
    return unless force || locations_by_code.nil?

    # The assumption here is that the cache will be updated if a new Location is created
    cache_key = "location_service/#{Location.maximum(:id)}"
    self.locations_by_code = Rails.cache.fetch(cache_key, expires_in: 48.hours) do
      Location.all.map { |loc| [loc.location_code, loc] }.to_h
    end
  end

  alias with_cache? with_cache

  def find_by_code(code)
    if with_cache?
      rebuild_cache
      locations_by_code[code]
    else
      Location.find_by(location_code: code)
    end
  end

  # Ducktyping to support app/services/field_value_service.rb#record_name_value :)
  def find_by(opts = {})
    code = opts.with_indifferent_access[:location_code]
    return unless code.present?

    find_by_code(code)
  end

  def find_by_codes(codes)
    if with_cache?
      rebuild_cache
      locations_by_code.slice(*codes).values
    else
      Location.where(location_code: codes).to_a
    end
  end

  def ancestor_code(code, admin_level)
    location = find_by_code(code)
    return unless location && location.admin_level >= admin_level

    location.hierarchy[admin_level]
  end

  def ancestor(code, admin_level)
    ancestor_code = self.ancestor_code(code, admin_level)
    return unless ancestor_code

    find_by_code(ancestor_code)
  end
end
