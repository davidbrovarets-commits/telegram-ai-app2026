-- Create function to update timestamp
CREATE OR REPLACE FUNCTION update_news_user_state_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now();
RETURN NEW;
END;
$$ language 'plpgsql';
-- Create trigger (only if it doesn't exist, wrapped in anonymous block)
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'trigger_news_user_state_updated_at'
) THEN CREATE TRIGGER trigger_news_user_state_updated_at BEFORE
UPDATE ON news_user_state FOR EACH ROW EXECUTE PROCEDURE update_news_user_state_updated_at();
END IF;
END $$;