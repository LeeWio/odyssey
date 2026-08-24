# Comment Module

Handles discussion and interaction around content.

## Responsibilities

- render one shared `CommentSystem` for posts, moments, and guestbook entries
- keep complete parent/child relationships in the data model while presenting a two-level thread
- make reply targets explicit with `author → parent author`
- support sorting, reply disclosure, likes, edit/delete/report actions, optimistic drafts, and comment anchors

## Ownership

`components/comment/` is the only UI owner. Feature-specific entry points may wrap or configure
`CommentSystem`, but must not implement another composer, query flow, or recursive comment card.
