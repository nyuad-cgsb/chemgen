-- Searching for a WpPost Term

SELECT wp.post_title, wtr.object_id, wtt.taxonomy, wt.`slug`
FROM  `wp_posts` wp
INNER JOIN  `wp_postmeta` wm ON ( wm.`post_id` = wp.`ID` )
INNER JOIN  `wp_term_relationships` wtr ON ( wp.`ID` = wtr.`object_id` )
INNER JOIN  `wp_term_taxonomy` wtt ON ( wtr.`term_taxonomy_id` = wtt.`term_taxonomy_id` )
INNER JOIN  `wp_terms` wt ON ( wt.`term_id` = wtt.`term_id` )
AND wtt.taxonomy =  'envira-tag'
AND wt.slug =  '2016-11-01_Enhancer_M_A04'
ORDER BY wp.post_date DESC
LIMIT 0 , 30

SELECT wp.post_title,  wtt.taxonomy, wt.slug, wtr.object_id, wm.meta_key, wm.meta_value 
FROM  `wp_posts` wp
INNER JOIN  `wp_postmeta` wm ON ( wm.`post_id` = wp.`ID` )
INNER JOIN  `wp_term_relationships` wtr ON ( wp.`ID` = wtr.`object_id` )
INNER JOIN  `wp_term_taxonomy` wtt ON ( wtr.`term_taxonomy_id` = wtt.`term_taxonomy_id` )
INNER JOIN  `wp_terms` wt ON ( wt.`term_id` = wtt.`term_id` )
AND wtt.taxonomy =  'envira-tag'
AND wt.slug = 'AHR2-2016-12-11-PR_Restrictive_N2_R04A92'
ORDER BY wp.post_date DESC
LIMIT 0 , 30

AHR2-2016-12-11-PR_Permissive_M_Y43F4B3


26-RNAi.1.N2.S_D02
226
