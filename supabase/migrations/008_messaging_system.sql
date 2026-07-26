-- Messaging System Migration
-- Enables real-time chat between creators and brands

-- ============================================
-- CONVERSATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
    brand_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    last_message_preview TEXT,
    last_message_at TIMESTAMPTZ,
    last_message_sender_id UUID REFERENCES profiles(id),
    brand_unread_count INTEGER DEFAULT 0,
    creator_unread_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'blocked')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure unique conversation between brand and creator per campaign
    UNIQUE(campaign_id, brand_id, creator_id),
    
    -- Prevent self-conversation
    CHECK (brand_id != creator_id)
);

-- Indexes for conversations
CREATE INDEX idx_conversations_brand_id ON conversations(brand_id);
CREATE INDEX idx_conversations_creator_id ON conversations(creator_id);
CREATE INDEX idx_conversations_campaign_id ON conversations(campaign_id);
CREATE INDEX idx_conversations_last_message_at ON conversations(last_message_at DESC);
CREATE INDEX idx_conversations_status ON conversations(status);

-- ============================================
-- MESSAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    content_type TEXT DEFAULT 'text' CHECK (content_type IN ('text', 'image', 'file', 'system')),
    attachment_url TEXT,
    attachment_name TEXT,
    attachment_size INTEGER,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Content validation
    CHECK (char_length(content) <= 5000)
);

-- Indexes for messages
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_unread ON messages(conversation_id, read_at) WHERE read_at IS NULL;

-- ============================================
-- TRIGGER: Update conversation on new message
-- ============================================
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $$
DECLARE
    v_brand_id UUID;
    v_creator_id UUID;
    v_campaign_id UUID;
BEGIN
    -- Get conversation details
    SELECT brand_id, creator_id, campaign_id 
    INTO v_brand_id, v_creator_id, v_campaign_id
    FROM conversations 
    WHERE id = NEW.conversation_id;
    
    -- Update conversation
    UPDATE conversations 
    SET 
        last_message_preview = LEFT(NEW.content, 100),
        last_message_at = NEW.created_at,
        last_message_sender_id = NEW.sender_id,
        brand_unread_count = CASE WHEN NEW.sender_id != v_brand_id THEN brand_unread_count + 1 ELSE 0 END,
        creator_unread_count = CASE WHEN NEW.sender_id != v_creator_id THEN creator_unread_count + 1 ELSE 0 END,
        updated_at = NOW()
    WHERE id = NEW.conversation_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_conversation_on_message
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_on_message();

-- ============================================
-- TRIGGER: Update conversation updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations SET updated_at = NOW() WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_conversation_timestamp
    AFTER UPDATE ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_timestamp();

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Create or get conversation between brand and creator
CREATE OR REPLACE FUNCTION get_or_create_conversation(
    p_campaign_id UUID DEFAULT NULL,
    p_brand_id UUID DEFAULT NULL,
    p_creator_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_conversation_id UUID;
BEGIN
    -- Try to find existing conversation
    SELECT id INTO v_conversation_id
    FROM conversations
    WHERE 
        (campaign_id IS NOT DISTINCT FROM p_campaign_id)
        AND brand_id = p_brand_id
        AND creator_id = p_creator_id
        AND status = 'active';
    
    -- Create if not exists
    IF v_conversation_id IS NULL THEN
        INSERT INTO conversations (campaign_id, brand_id, creator_id)
        VALUES (p_campaign_id, p_brand_id, p_creator_id)
        RETURNING id INTO v_conversation_id;
    END IF;
    
    RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_read(
    p_conversation_id UUID,
    p_reader_id UUID
) RETURNS VOID AS $$
DECLARE
    v_brand_id UUID;
    v_creator_id UUID;
BEGIN
    -- Get conversation details
    SELECT brand_id, creator_id INTO v_brand_id, v_creator_id
    FROM conversations WHERE id = p_conversation_id;
    
    -- Mark unread messages as read
    UPDATE messages
    SET read_at = NOW()
    WHERE conversation_id = p_conversation_id
        AND sender_id != p_reader_id
        AND read_at IS NULL;
    
    -- Reset unread count for the reader
    IF p_reader_id = v_brand_id THEN
        UPDATE conversations SET brand_unread_count = 0 WHERE id = p_conversation_id;
    ELSIF p_reader_id = v_creator_id THEN
        UPDATE conversations SET creator_unread_count = 0 WHERE id = p_conversation_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get conversation with details
CREATE OR REPLACE FUNCTION get_conversation_details(
    p_conversation_id UUID,
    p_user_id UUID
) RETURNS TABLE (
    conversation_data JSON,
    other_user_data JSON,
    campaign_data JSON
) AS $$
DECLARE
    v_brand_id UUID;
    v_creator_id UUID;
    v_campaign_id UUID;
BEGIN
    -- Get conversation details
    SELECT brand_id, creator_id, campaign_id 
    INTO v_brand_id, v_creator_id, v_campaign_id
    FROM conversations 
    WHERE id = p_conversation_id;
    
    -- Return conversation data
    SELECT row_to_json(c) INTO conversation_data
    FROM (SELECT * FROM conversations WHERE id = p_conversation_id) c;
    
    -- Get other user's profile
    IF p_user_id = v_brand_id THEN
        SELECT row_to_json(p) INTO other_user_data
        FROM (SELECT id, display_name AS full_name, avatar_url, role::text AS user_type FROM profiles WHERE id = v_creator_id) p;
    ELSE
        SELECT row_to_json(p) INTO other_user_data
        FROM (SELECT id, display_name AS full_name, avatar_url, role::text AS user_type FROM profiles WHERE id = v_brand_id) p;
    END IF;
    
    -- Get campaign data if exists
    IF v_campaign_id IS NOT NULL THEN
        SELECT row_to_json(c) INTO campaign_data
        FROM (
            SELECT cmp.id, cmp.name AS title, b.name AS brand_name, cmp.total_budget_cents AS budget, cmp.end_at AS deadline 
            FROM campaigns cmp
            LEFT JOIN brands b ON b.id = cmp.brand_id
            WHERE cmp.id = v_campaign_id
        ) c;
    ELSE
        campaign_data := NULL;
    END IF;
    
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Conversations: Users can see conversations they're part of
CREATE POLICY "Users can view their conversations"
    ON conversations FOR SELECT
    USING (
        auth.uid() = brand_id OR auth.uid() = creator_id
    );

-- Conversations: Users can update their own conversations
CREATE POLICY "Users can update their conversations"
    ON conversations FOR UPDATE
    USING (
        auth.uid() = brand_id OR auth.uid() = creator_id
    );

-- Messages: Users can view messages in their conversations
CREATE POLICY "Users can view messages in their conversations"
    ON messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM conversations
            WHERE conversations.id = messages.conversation_id
            AND (conversations.brand_id = auth.uid() OR conversations.creator_id = auth.uid())
        )
    );

-- Messages: Users can send messages in their conversations
CREATE POLICY "Users can send messages"
    ON messages FOR INSERT
    WITH CHECK (
        sender_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM conversations
            WHERE conversations.id = conversation_id
            AND (conversations.brand_id = auth.uid() OR conversations.creator_id = auth.uid())
        )
    );

-- Messages: Users can update their own messages (within 15 minutes)
CREATE POLICY "Users can update their messages"
    ON messages FOR UPDATE
    USING (
        sender_id = auth.uid() AND
        created_at > NOW() - INTERVAL '15 minutes'
    );

-- Messages: Users can delete their own messages (within 15 minutes)
CREATE POLICY "Users can delete their messages"
    ON messages FOR DELETE
    USING (
        sender_id = auth.uid() AND
        created_at > NOW() - INTERVAL '15 minutes'
    );

-- ============================================
-- REALTIME SUBSCRIPTIONS
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;