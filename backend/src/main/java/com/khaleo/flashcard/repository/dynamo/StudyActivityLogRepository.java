package com.khaleo.flashcard.repository.dynamo;

import com.khaleo.flashcard.model.dynamo.StudyActivityLog;
import java.util.List;

public interface StudyActivityLogRepository {

    void save(StudyActivityLog log);

    List<StudyActivityLog> findByUserId(String userId, int limit);
}
