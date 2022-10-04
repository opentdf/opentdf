module.exports = ({github, context}) => {
    
    //Research
    const views = github.rest.repos.getViews({
        owner: context.repo.owner,
        repo: context.repo.repo,
        })

    //Activation
    const clones = github.rest.repos.getClones({
        owner: context.repo.owner,
        repo: context.repo.repo,
        })
    const forks = github.rest.repos.listForks({
    owner: context.repo.owner,
    repo: context.repo.repo,
    }).length

    // Retained Usage: Opening Issues, opening PRs, writing comments, posting/commenting on Discussions
    return {views: views, clones: clones, forks: forks}
}