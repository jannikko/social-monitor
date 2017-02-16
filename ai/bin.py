from workers.topic import create_topic_model, calculate_topics, cluster_accounts, plot_lda
from workers.follower import request_followers
from workers.timeline import request_timelines

app_id = "91087c74-161f-42fc-8d31-ef4a4295598e"

# request_followers(app_id)
# request_timelines(app_id)
create_topic_model(app_id)
calculate_topics(app_id)
# plot_lda(app_id)
