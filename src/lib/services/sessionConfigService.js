import { supabase } from '../supabase';

/**
 * Service for managing session configurations
 */
class SessionConfigService {
  /**
   * Save a session configuration
   * @param {string} sessionId - The ID of the session
   * @param {Object} config - The configuration object to save
   * @returns {Promise<Object>} The saved configuration
   */
  async saveConfig(sessionId, config) {
    const { data, error } = await supabase
      .from('session_configurations')
      .upsert({
        session_id: sessionId,
        configuration: config
      }, {
        onConflict: 'session_id'
      });

    if (error) throw error;
    return data;
  }

  /**
   * Load the latest configuration for a session
   * @param {string} sessionId - The ID of the session
   * @returns {Promise<Object>} The latest configuration
   */
  async loadConfig(sessionId) {
    const { data, error } = await supabase
      .from('session_configurations')
      .select('configuration')
      .eq('session_id', sessionId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No configuration found
        return null;
      }
      throw error;
    }

    return data?.configuration;
  }

  /**
   * Delete a session configuration
   * @param {string} sessionId - The ID of the session
   * @returns {Promise<void>}
   */
  async deleteConfig(sessionId) {
    const { error } = await supabase
      .from('session_configurations')
      .delete()
      .eq('session_id', sessionId);

    if (error) throw error;
  }

  /**
   * Get configuration history for a session
   * @param {string} sessionId - The ID of the session
   * @returns {Promise<Array>} Array of configurations with timestamps
   */
  async getConfigHistory(sessionId) {
    const { data, error } = await supabase
      .from('session_configurations')
      .select('configuration, created_at, updated_at')
      .eq('session_id', sessionId)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  /**
   * Restore a configuration from history
   * @param {string} sessionId - The ID of the session
   * @param {string} timestamp - The timestamp to restore from
   * @returns {Promise<Object>} The restored configuration
   */
  async restoreConfig(sessionId, timestamp) {
    // Get the configuration at the specified timestamp
    const { data: historyData, error: historyError } = await supabase
      .from('session_configurations')
      .select('configuration')
      .eq('session_id', sessionId)
      .lte('updated_at', timestamp)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (historyError) throw historyError;

    if (!historyData) {
      throw new Error('No configuration found at specified timestamp');
    }

    // Save it as the current configuration
    return this.saveConfig(sessionId, historyData.configuration);
  }

  /**
   * Validate a configuration object
   * @param {Object} config - The configuration to validate
   * @returns {boolean} Whether the configuration is valid
   */
  validateConfig(config) {
    // Add validation logic here
    if (!config) return false;
    
    // Check required fields
    const requiredFields = ['settings', 'ai_configuration'];
    for (const field of requiredFields) {
      if (!config[field]) return false;
    }
    
    return true;
  }
}

export const sessionConfigService = new SessionConfigService(); 