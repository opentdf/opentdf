async function getMetrics(github, context) {   
    // Views -- last 14 days
    const views = await github.rest.repos.getViews({
        owner: process.env.OWNER,
        repo: process.env.REPO,
        })
    
    // Clones -- last 14 days
    const clones = await github.rest.repos.getClones({
        owner: process.env.OWNER,
        repo: process.env.REPO,
        })

    // // Forks -- all time
    // const forks = await github.rest.repos.listForks({
    //     owner: process.env.OWNER,
    //     repo: process.env.REPO,
    // })

    const get_info = await github.rest.repos.get({
        owner: process.env.OWNER,
        repo: process.env.REPO,
    })

    // Stars -- all time listStargazersForRepo: ["GET /repos/{owner}/{repo}/stargazers"]
    // const stars = await github.rest.repos.listStargazersForRepo({
    //     owner: process.env.OWNER,
    //     repo: process.env.REPO,
    // })

    // Watchers listWatchersForRepo: ["GET /repos/{owner}/{repo}/subscribers"]


    // Commits -- last 14 days getParticipationStats: ["GET /repos/{owner}/{repo}/stats/participation"] -- add togethor last two
    const commits = await github.rest.repos.getParticipationStats({
        owner: process.env.OWNER,
        repo: process.env.REPO,
        })
    

    // Referral Sources -- last 14 days getTopReferrers: ["GET /repos/{owner}/{repo}/traffic/popular/referrers"]
    const referrals = await github.rest.repos.getTopReferrers({
        owner: process.env.OWNER,
        repo: process.env.REPO,
        })
    
    const data = {
        timestamp: new Date(),
        event_type: process.env.EVENT_TYPE,
        views: views.data.count, 
        clones: clones.data.count, 
        forks: get_info.data.forks_count,
        stars: get_info.data.stargazers_count,
        watchers: get_info.data.subscribers_count,
        commits: commits.data.all[commits.data.all.length-1] + commits.data.all[commits.data.all.length-2],
        top_referral_sources: referrals.data
    }
    // Retained Usage: Opening Issues, opening PRs, writing comments, posting/commenting on Discussions
    return data
} 

module.exports = ({github, context}) => getMetrics(github, context)
